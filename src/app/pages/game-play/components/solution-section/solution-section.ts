import { AfterViewChecked, Component, effect, ElementRef, inject, OnInit, output, viewChild } from '@angular/core'
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
export class SolutionSection implements OnInit, AfterViewChecked {
	whenMovingCueToSolutionBox = output<SolvedTriad>()

	readonly store = inject(GlobalStore)

	answerFormControl = new FormControl<string>('', { validators: [Validators.required] })

	// Flag to track if we need to focus the answer field or not
	shouldFocusAnswerField = false

	protected readonly GamePlayState = GamePlayState

	private readonly subscriptions$ = new Subscription()

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly gamePlayLogic = inject(GamePlayLogic)

	private readonly turnService = inject(TurnService)

	private readonly snackbarService = inject(SnackbarService)

	private readonly answerFieldRef = viewChild<ElementRef<HTMLInputElement>>('answerField')

	private readonly bubblePopAudio = new Audio()

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
	}

	ngOnInit() {
		this.subscribeToAnswerFieldChanges()
	}

	ngAfterViewChecked() {
		// Focus the answer field if needed
		if (this.shouldFocusAnswerField) {
			const answerField = this.answerFieldRef()?.nativeElement
			if (answerField) {
				// Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
				setTimeout(() => {
					answerField.focus()
					this.shouldFocusAnswerField = false
				}, 0)
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
							this.shouldFocusAnswerField = true
						} else {
							this.store.setGamePlayState(GamePlayState.WRONG_TRIAD)
							this.useTurn()
						}
					}),
					filter((success) => !success),
					delay(3000),
					tap(() => {
						// Only change state back to PLAYING if not in WON or LOST state
						if (this.store.gamePlayState() !== GamePlayState.WON && this.store.gamePlayState() !== GamePlayState.LOST) {
							this.store.setGamePlayState(GamePlayState.PLAYING)
							this.store.setSelectedCues([])
						}
					}),
				)
				.subscribe()
		}
	}

	submitAnswer(answer: string | null) {
		const selectedCues = this.store.selectedCues()
		if (answer !== null && answer.length > 0 && selectedCues && selectedCues.length === 3) {
			this.gamePlayApi.checkAnswer(selectedCues, answer).subscribe({
				next: (response) => this.handleAnswerResponse(response),
			})
		}
	}

	private handleAnswerResponse(response: boolean | SolvedTriad) {
		if (response && typeof response !== 'boolean') {
			this.bubblePopAudio.playbackRate = 0.7
			this.bubblePopAudio.play()
			this.store.addSolvedTriad(response)

			for (let i = 0; i < response.cues.length; i++) {
				setTimeout(
					() => {
						this.store.addCueToExplode(response.cues[i])
					},
					100 * (i + 1),
				)
			}

			setTimeout(() => {
				this.whenMovingCueToSolutionBox.emit(response)
				this.store.setGamePlayState(GamePlayState.CORRECT_ANSWER)
			}, 1000)
		} else {
			this.store.setGamePlayState(GamePlayState.WRONG_ANSWER)
			if (!this.store.hintUsed()) {
				this.useTurn()
			}
		}
		this.answerFormControl.reset()

		setTimeout(() => {
			// Only change state if not in the WON or LOST state
			if (this.store.gamePlayState() !== GamePlayState.WON && this.store.gamePlayState() !== GamePlayState.LOST) {
				// Always reset the keyword length hint back to null so the normal input field is shown
				this.store.setKeywordLengthHint(null)

				if (response && typeof response != 'boolean') {
					this.store.setSelectedCues([])
					this.store.removeSolvedCues(response.cues) // Remove the solved cues from the list of cues shown to the player
					this.store.setGamePlayState(GamePlayState.PLAYING)

					// If the game is in its initial state and there are no cues left, fetch the final triad cues and progress the game to the final stage
					if (this.store.triadsStep() === 'INITIAL' && this.store.cues()?.length === 0) {
						this.store.updateTriadStep('FINAL')

						this.store.setIsFetchingFinalTriadCues(true)
						this.getFinalTriadCuesCues()
							.then((finalTriadCuesCues) => {
								this.store.setFinalTriadCues(finalTriadCuesCues)
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
		}, 2000)
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
		const solvedTriads = this.store.solvedTriads()
		return await firstValueFrom(this.gamePlayApi.fetchFinalTriadCues(solvedTriads.map((triad) => triad.id)))
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
