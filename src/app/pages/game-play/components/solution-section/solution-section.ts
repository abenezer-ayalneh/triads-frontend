import { AfterViewChecked, Component, effect, ElementRef, inject, OnDestroy, OnInit, output, viewChild } from '@angular/core'
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms'
import { delay, filter, firstValueFrom, Subscription, tap } from 'rxjs'

import { AutoCapitalize } from '../../../../shared/directives/auto-capitalize'
import { SnackbarService } from '../../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../../state/global.store'
import { GamePlayState } from '../../enums/game-play.enum'
import { SolvedTriad } from '../../interfaces/triad.interface'
import { GamePlayApi } from '../../services/game-play-api'
import { GamePlayLogic } from '../../services/game-play-logic'
import { TurnService } from '../../services/turn-service'
import { InputSet } from '../input-set/input-set'

@Component({
	selector: 'app-solution-section',
	imports: [InputSet, ReactiveFormsModule, AutoCapitalize],
	templateUrl: './solution-section.html',
	styleUrl: './solution-section.scss',
})
export class SolutionSection implements OnInit, AfterViewChecked, OnDestroy {
	whenMovingCueToSolutionBox = output<SolvedTriad>()

	readonly store = inject(GlobalStore)

	answerFormControl = new FormControl<string>('', { validators: [Validators.required] })

	// Flag to track if we need to focus the answer field or not
	shouldFocusAnswerField = false

	protected readonly GamePlayState = GamePlayState

	private readonly subscriptions$ = new Subscription()

	private timeoutIds: ReturnType<typeof setTimeout>[] = []

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly gamePlayLogic = inject(GamePlayLogic)

	private readonly turnService = inject(TurnService)

	private readonly snackbarService = inject(SnackbarService)

	private readonly answerFieldRef = viewChild<ElementRef<HTMLInputElement>>('answerField')

	private readonly bubblePopAudio = new Audio()

	/**
	 * Detects if the current device is a mobile device
	 */
	private isMobileDevice(): boolean {
		return (
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768 && 'ontouchstart' in window)
		)
	}

	constructor() {
		this.bubblePopAudio.src = 'sounds/three-pops.mp3'

		// Watch for game state changes to determine when to focus the answer field
		effect(() => {
			const gameState = this.store.gamePlayState()
			// When the game state changes to ACCEPT_ANSWER or WRONG_ANSWER, set the flag to focus
			if (gameState === GamePlayState.ACCEPT_ANSWER || gameState === GamePlayState.WRONG_ANSWER) {
				this.shouldFocusAnswerField = true
			}
		})

		// Watch loading signals and disable/enable answerFormControl
		effect(() => {
			const isCheckingAnswer = this.store.isCheckingAnswer()
			const isCheckingTriad = this.store.isCheckingTriad()
			const isLoading = isCheckingAnswer || isCheckingTriad

			if (isLoading) {
				this.answerFormControl.disable()
			} else {
				this.answerFormControl.enable()
			}
		})
	}

	ngOnInit() {
		this.subscribeToAnswerFieldChanges()
	}

	ngOnDestroy() {
		this.subscriptions$.unsubscribe()
		// CRITICAL: Clear all pending timeouts
		this.timeoutIds.forEach((id) => clearTimeout(id))
		this.timeoutIds = []
	}

	resetComponentState() {
		// Reset form control
		this.answerFormControl.reset()
		// Reset focus flag
		this.shouldFocusAnswerField = false
		// Clear all pending timeouts
		this.timeoutIds.forEach((id) => clearTimeout(id))
		this.timeoutIds = []
	}

	ngAfterViewChecked() {
		// Focus the answer field if needed
		if (this.shouldFocusAnswerField) {
			const answerField = this.answerFieldRef()?.nativeElement
			if (answerField) {
				// Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
				const timeoutId = setTimeout(() => {
					answerField.focus()
					// On mobile devices, also trigger click to ensure keyboard appears
					if (this.isMobileDevice()) {
						answerField.click()
					}
					this.shouldFocusAnswerField = false
				}, 0)
				this.timeoutIds.push(timeoutId)
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
								this.shouldFocusAnswerField = true
								// Trigger keyboard on mobile devices after state change
								if (this.isMobileDevice()) {
									// Use a small delay to ensure the input field is rendered
									const timeoutId = setTimeout(() => {
										const answerField = this.answerFieldRef()?.nativeElement
										if (answerField) {
											answerField.focus()
											// On some mobile browsers, we need to click to trigger keyboard
											answerField.click()
										}
									}, 100)
									this.timeoutIds.push(timeoutId)
								}
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
							// Only change state back to PLAYING if not in WON or LOST state and turns are not exhausted
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

	submitAnswer(answer: string | null) {
		const selectedCues = this.store.selectedCues()
		if (answer !== null && answer.length > 0 && selectedCues && selectedCues.length === 3) {
			this.store.setIsCheckingAnswer(true)
			this.subscriptions$.add(
				this.gamePlayApi.checkAnswer(selectedCues, answer).subscribe({
					next: (response) => {
						this.handleAnswerResponse(response)
						this.store.setIsCheckingAnswer(false)
					},
					error: () => {
						this.store.setIsCheckingAnswer(false)
					},
				}),
			)
		}
	}

	private handleAnswerResponse(response: boolean | SolvedTriad) {
		if (response && typeof response !== 'boolean') {
			// Reset deferred turn flag on correct answer (turn was not consumed)
			this.store.setHintUsedWithOneTurnRemaining(false)
			this.bubblePopAudio.playbackRate = 0.7
			this.bubblePopAudio.play()
			this.store.addSolvedTriad(response)

			for (let i = 0; i < response.cues.length; i++) {
				const timeoutId = setTimeout(
					() => {
						this.store.addCueToExplode(response.cues[i])
					},
					100 * (i + 1),
				)
				this.timeoutIds.push(timeoutId)
			}

			const timeoutId = setTimeout(() => {
				this.whenMovingCueToSolutionBox.emit(response)
				this.store.setGamePlayState(GamePlayState.CORRECT_ANSWER)
			}, 1000)
			this.timeoutIds.push(timeoutId)
		} else {
			this.store.setGamePlayState(GamePlayState.WRONG_ANSWER)
			// If hint was used with one turn remaining, consume the deferred turn
			if (this.store.hintUsedWithOneTurnRemaining()) {
				this.useTurn()
				this.store.setHintUsedWithOneTurnRemaining(false)
				// Check if turns are exhausted immediately after using a turn
				if (this.turnService.numberOfAvailableTurns(this.store.turns()) === 0) {
					this.gamePlayLogic.handleGameLost()
				}
			} else if (!this.store.hintUsed()) {
				// Normal case: use a turn if hint wasn't used
				this.useTurn()
				// Check if turns are exhausted immediately after using a turn
				if (this.turnService.numberOfAvailableTurns(this.store.turns()) === 0) {
					this.gamePlayLogic.handleGameLost()
				}
			}
		}
		this.answerFormControl.reset()

		const timeoutId = setTimeout(() => {
			// Only change state if not in the WON or LOST state
			if (this.store.gamePlayState() !== GamePlayState.WON && this.store.gamePlayState() !== GamePlayState.LOST) {
				// Always reset the keyword length hint and first letter hint back to null so the normal input field is shown
				this.store.setKeywordLengthHint(null)
				this.store.setFirstLetterHint(null)
				this.store.setActiveHintType(null)

				if (response && typeof response != 'boolean') {
					// Reset used hint types only when a triad is solved correctly (not on wrong guesses)
					this.store.resetUsedHintTypes()
					this.store.setSelectedCues([])
					this.store.removeSolvedCues(response.cues) // Remove the solved cues from the list of cues shown to the player
					this.store.setGamePlayState(GamePlayState.PLAYING)

					// Auto-select remaining cues if exactly 3 remain (after 2 triads solved)
					const remainingCues = this.store.cues()
					if (remainingCues && remainingCues.length === 3) {
						this.store.setSelectedCues([...remainingCues])
						this.store.setGamePlayState(GamePlayState.CHECK_SOLUTION)
					}

					// If the game is in its initial state and there are no cues left, fetch the final triad cues and progress the game to the final stage
					if (this.store.triadsStep() === 'INITIAL' && this.store.cues()?.length === 0) {
						this.store.updateTriadStep('FINAL')

						this.store.setIsFetchingFinalTriadCues(true)
						this.getFinalTriadCuesCues()
							.then((finalTriadCuesCues) => {
								this.store.setFinalTriadCues(finalTriadCuesCues)
								// Auto-select final triad cues (bonus round) - always 3 cues
								if (finalTriadCuesCues && finalTriadCuesCues.length === 3) {
									this.store.setSelectedCues([...finalTriadCuesCues])
									this.store.setGamePlayState(GamePlayState.CHECK_SOLUTION)
								}
							})
							.catch(() => {
								// Error handling for fourth triad fetch failure
								this.snackbarService.showSnackbar('Error fetching final triad cues')
							})
							.finally(() => {
								this.store.setIsFetchingFinalTriadCues(false)
							})
					}
					// If the game was in its final stage and the player answers the last triad, finalize the game.
					else if (this.store.triadsStep() === 'FINAL') {
						this.gamePlayLogic.handleGameWon()
					} else {
						this.store.updateTriadStep('INITIAL')
					}
				} else {
					// If the game was in its initial stage and the player ran out of turns
					if (this.turnService.numberOfAvailableTurns(this.store.turns()) === 0) {
						this.gamePlayLogic.handleGameLost()
					} else {
						const availableHints = this.store.hints().filter((hint) => hint.available).length
						if (availableHints === 0) {
							this.store.setGamePlayState(GamePlayState.PLAYING)
							this.store.setSelectedCues([])
						} else {
							this.store.setGamePlayState(GamePlayState.ACCEPT_ANSWER)
							this.shouldFocusAnswerField = true
						}
					}
				}
			}

			this.store.setHintUsage(false)
			this.store.setHintUsedWithOneTurnRemaining(false)
		}, 2000)
		this.timeoutIds.push(timeoutId)
	}

	private useTurn() {
		try {
			const turnsAfterUsage = this.turnService.useTurn(this.store.turns())
			this.store.setTurns(turnsAfterUsage)
		} catch (error) {
			this.snackbarService.showSnackbar(`Error: ${(error as { message: string }).message ?? 'Unknown error'}`)
		}
	}

	private async getFinalTriadCuesCues() {
		const triadGroupId = this.store.triadGroupId()

		if (triadGroupId) {
			return await firstValueFrom(this.gamePlayApi.fetchFinalTriadCues(triadGroupId))
		}

		return Promise.reject()
	}

	private subscribeToAnswerFieldChanges() {
		this.subscriptions$.add(
			this.gamePlayLogic.answerFieldFocus$.pipe(filter((focus) => focus)).subscribe({
				next: () => {
					this.answerFieldRef()?.nativeElement.focus()
				},
			}),
		)

		this.subscriptions$.add(
			this.gamePlayLogic.answerFieldValue$.pipe(filter((value) => value != null)).subscribe({
				next: (value) => {
					this.answerFormControl.setValue(value)
				},
			}),
		)
	}
}
