import { Component, ElementRef, inject, OnDestroy, viewChild } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { delay, filter, firstValueFrom, Subscription, tap } from 'rxjs'

import { SnackbarService } from '../../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../../state/global.store'
import { GamePlayState } from '../../enums/game-play.enum'
import { GamePlayApi } from '../../services/game-play-api'
import { GamePlayLogic } from '../../services/game-play-logic'
import { HintService } from '../../services/hint-service'
import { TurnService } from '../../services/turn-service'

@Component({
	selector: 'app-hints-box',
	imports: [ReactiveFormsModule],
	templateUrl: './hints-box.html',
	styleUrl: './hints-box.scss',
})
export class HintsBox implements OnDestroy {
	readonly store = inject(GlobalStore)

	private readonly hintService = inject(HintService)

	private readonly snackbarService = inject(SnackbarService)

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly gamePlayLogic = inject(GamePlayLogic)

	private readonly turnService = inject(TurnService)

	private readonly hintChoiceModalRef = viewChild<ElementRef<HTMLDialogElement>>('hintChoiceModal')

	private readonly subscriptions$ = new Subscription()

	ngOnDestroy() {
		this.subscriptions$.unsubscribe()
	}

	/**
	 * Checks if hints should be disabled due to turns being used up.
	 * Hints are disabled when 2 or more turns have been used (i.e., when only 1 or 0 turns remain).
	 */
	areHintsDisabledDueToTurns(): boolean {
		const availableTurns = this.turnService.numberOfAvailableTurns(this.store.turns())
		return availableTurns <= 1
	}

	onHintClick() {
		// Prevent hint usage if hints are disabled due to turns being used up
		if (this.areHintsDisabledDueToTurns()) {
			return
		}

		const availableHints = this.store.hints().filter((hint) => hint.available).length
		const selectedCues = this.store.selectedCues()
		const cues = this.store.cues()
		const availableCues = cues && cues.length > 0 ? this.store.cues() : this.store.finalTriadCues()

		// Show hint choice modal if:
		// 1. Only 1 hint available, OR
		// 2. 3 cues are selected (triad-forming), OR
		// 3. Only 3 cues remain (final triad)
		const shouldShowChoice = availableHints === 1 || selectedCues.length === 3 || availableCues?.length === 3

		if (availableCues && availableCues.length > 0) {
			if (shouldShowChoice) {
				this.hintChoiceModalRef()?.nativeElement.showModal()
			} else {
				this.useHint()
			}
		}
	}

	useHint(hintExtra?: 'KEYWORD_LENGTH' | 'FIRST_LETTER') {
		// Prevent hint usage if hints are disabled due to turns being used up
		if (this.areHintsDisabledDueToTurns()) {
			return
		}

		this.store.setHintUsage(true)

		// Check if user has 3 cues selected - if so, use those for the hint
		const selectedCues = this.store.selectedCues()
		const hadThreeSelected = selectedCues.length === 3

		// Determine which cues to use for the hint request
		let availableCues: string[] | null = null
		if (hadThreeSelected) {
			// User has 3 cues selected, use those for the hint
			availableCues = selectedCues
		} else {
			// Fall back to current behavior: use all cues or final triad cues
			const cues = this.store.cues()
			availableCues = cues && cues.length > 0 ? this.store.cues() : this.store.finalTriadCues()
		}

		if (availableCues) {
			try {
				this.store.setIsFetchingHint(true)
				firstValueFrom(this.hintService.getHint(availableCues, hintExtra))
					.then((triadsForHint) => {
						const hints = this.store.hints()
						const useHintResponse = this.hintService.useHint(hints, this.store.turns())

						if (triadsForHint && triadsForHint.hint) {
							// When the player uses a hint with an extra value, show a special hint
							if (triadsForHint.with === 'KEYWORD_LENGTH') {
								// Set keyword length hint, but preserve first letter if it exists
								this.store.setKeywordLengthHint(triadsForHint.withValue ? Number(triadsForHint.withValue) : null)
								// Track that this hint type is now active
								this.store.setActiveHintType('KEYWORD_LENGTH')
								// Track that this hint type has been used (so it stays disabled after wrong guesses)
								this.store.addUsedHintType('KEYWORD_LENGTH')
								// If first letter hint already exists, keep it for combination
								// The first letter will be filled in InputSet when it's displayed
								// Clear answerFieldValue$ since we're switching to InputSet
								if (this.store.firstLetterHint()) {
									this.gamePlayLogic.answerFieldValue$.next(null)
								}
							} else if (triadsForHint.with === 'FIRST_LETTER' && triadsForHint.withValue) {
								// Store the first letter hint
								this.store.setFirstLetterHint(triadsForHint.withValue)
								// Track that this hint type is now active
								this.store.setActiveHintType('FIRST_LETTER')
								// Track that this hint type has been used (so it stays disabled after wrong guesses)
								this.store.addUsedHintType('FIRST_LETTER')

								// If keyword length hint already exists, we'll fill the first box in InputSet
								// Otherwise, set it for the regular input field
								if (this.store.keywordLengthHint() === null) {
									this.gamePlayLogic.answerFieldValue$.next(triadsForHint.withValue)
									// Set the flag to focus the answer field when it appears
									this.gamePlayLogic.answerFieldFocus$.next(true)
								}
							}

							// Close the extra hint modal
							this.hintChoiceModalRef()?.nativeElement.close()

							// Only update selected cues if user didn't originally have 3 selected
							// This preserves the user's selection when they request a hint for their selected triad
							if (!hadThreeSelected) {
								// Show the hint cues as selected on the UI
								this.store.setSelectedCues(triadsForHint.hint)
							}

							// Update the hints and turn values
							this.store.setHints(useHintResponse.hints)
							this.store.setTurns(useHintResponse.turns)

							// Track if turn was deferred (hint used with only 1 turn remaining)
							if (useHintResponse.turnDeferred) {
								this.store.setHintUsedWithOneTurnRemaining(true)
							} else {
								this.store.setHintUsedWithOneTurnRemaining(false)
							}

							// Check if turns are exhausted after using a hint
							if (this.turnService.numberOfAvailableTurns(useHintResponse.turns) === 0) {
								this.gamePlayLogic.handleGameLost()
							} else {
								// Skip the "Check Solution" step
								this.checkTriad()
							}
						}
						this.store.setIsFetchingHint(false)
					})
					.catch(() => {
						this.store.setIsFetchingHint(false)
					})
			} catch (error) {
				this.store.setIsFetchingHint(false)
				this.snackbarService.showSnackbar(`Error: ${(error as { message: string }).message ?? 'Unknown error'}`)
			}
		}
	}

	checkTriad() {
		const selectedCues = this.store.selectedCues()

		if (selectedCues.length === 3) {
			this.store.setIsCheckingTriad(true)
			this.subscriptions$.add(
				this.gamePlayApi
					.checkTriad(selectedCues)
					.pipe(
						tap((success) => {
							this.store.setIsCheckingTriad(false)
							if (success) {
								this.store.setGamePlayState(GamePlayState.ACCEPT_ANSWER)
								this.gamePlayLogic.answerFieldFocus$.next(true)
							} else {
								this.store.setGamePlayState(GamePlayState.WRONG_TRIAD)
								this.useTurn()
								// Check if turns are exhausted immediately after using a turn
								if (this.turnService.numberOfAvailableTurns(this.store.turns()) === 0) {
									this.gamePlayLogic.handleGameLost()
								}
							}
						}),
						filter((success) => !success),
						delay(2000),
						tap(() => {
							// Only change the state back to PLAYING if not in WON or LOST state and turns are not exhausted
							if (
								this.store.gamePlayState() !== GamePlayState.WON &&
								this.store.gamePlayState() !== GamePlayState.LOST &&
								this.turnService.numberOfAvailableTurns(this.store.turns()) > 0
							) {
								this.store.setGamePlayState(GamePlayState.PLAYING)
								this.store.setSelectedCues([])
							} else if (this.turnService.numberOfAvailableTurns(this.store.turns()) === 0) {
								// If turns are exhausted, ensure game lost state is set
								this.gamePlayLogic.handleGameLost()
							}
						}),
					)
					.subscribe({
						error: () => {
							this.store.setIsCheckingTriad(false)
						},
					}),
			)
		}
	}

	private useTurn() {
		try {
			const turnsAfterUsage = this.turnService.useTurn(this.store.turns())
			this.store.setTurns(turnsAfterUsage)
		} catch (error) {
			this.snackbarService.showSnackbar(`Error: ${(error as { message: string }).message ?? 'Unknown error'}`)
		}
	}
}
