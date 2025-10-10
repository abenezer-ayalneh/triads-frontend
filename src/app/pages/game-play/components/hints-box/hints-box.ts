import { Component, ElementRef, inject, viewChild } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { delay, filter, firstValueFrom, tap } from 'rxjs'

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
export class HintsBox {
	readonly store = inject(GlobalStore)

	private readonly hintService = inject(HintService)

	private readonly snackbarService = inject(SnackbarService)

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly gamePlayLogic = inject(GamePlayLogic)

	private readonly turnService = inject(TurnService)

	private readonly hintChoiceModalRef = viewChild<ElementRef<HTMLDialogElement>>('hintChoiceModal')

	onHintClick() {
		const availableHints = this.store.hints().filter((hint) => hint.available).length
		const visibleCues = this.store.cues()
		const shouldShowChoice = availableHints === 1 || visibleCues?.length === 3

		if (shouldShowChoice) {
			this.hintChoiceModalRef()?.nativeElement.showModal()
		} else {
			this.useHint()
		}
	}

	useHint(hintExtra?: 'KEYWORD_LENGTH' | 'FIRST_LETTER') {
		this.store.setHintUsage(true)
		const cues = this.store.cues()
		if (cues) {
			try {
				firstValueFrom(this.hintService.getHint(cues, hintExtra))
					.then((triadsForHint) => {
						const hints = this.store.hints()
						const useHintResponse = this.hintService.useHint(hints, this.store.turns())

						if (triadsForHint && triadsForHint.hint) {
							// When the player uses a hint with an extra value, show a special hint
							if (triadsForHint.with === 'KEYWORD_LENGTH') {
								this.store.setKeywordLengthHint(triadsForHint.withValue ? Number(triadsForHint.withValue) : null)
							} else if (triadsForHint.with === 'FIRST_LETTER' && triadsForHint.withValue) {
								this.gamePlayLogic.answerFieldValue$.next(triadsForHint.withValue)
								// Set the flag to focus the answer field when it appears
								this.gamePlayLogic.answerFieldFocus$.next(true)
							}

							// Close the extra hint modal
							this.hintChoiceModalRef()?.nativeElement.close()

							// Show the hint cues as selected on the UI
							this.store.setSelectedCues(triadsForHint.hint)

							// Update the hints and turn values
							this.store.setHints(useHintResponse.hints)
							this.store.setTurns(useHintResponse.turns)

							// Skip the "Check Solution" step
							this.checkTriad()
						}
					})
					.catch()
			} catch (error) {
				this.snackbarService.showSnackbar(`Error: ${(error as { message: string }).message ?? 'Unknown error'}`)
			}
		}
	}

	checkTriad() {
		const selectedCues = this.store.selectedCues()

		if (selectedCues.length === 3) {
			this.gamePlayApi
				.checkTriad(selectedCues)
				.pipe(
					tap((success) => {
						if (success) {
							this.store.setGamePlayState(GamePlayState.ACCEPT_ANSWER)
							this.gamePlayLogic.answerFieldFocus$.next(true)
						} else {
							this.store.setGamePlayState(GamePlayState.WRONG_TRIAD)
							this.useTurn()
						}
					}),
					filter((success) => !success),
					delay(3000),
					tap(() => {
						// Only change the state back to PLAYING if not in WON or LOST state
						if (this.store.gamePlayState() !== GamePlayState.WON && this.store.gamePlayState() !== GamePlayState.LOST) {
							this.store.setGamePlayState(GamePlayState.PLAYING)
							this.store.setSelectedCues([])
						}
					}),
				)
				.subscribe()
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
