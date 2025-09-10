import { NgClass } from '@angular/common'
import { Component, computed, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core'
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { AnimationItem } from 'lottie-web'
import { AnimationOptions, LottieComponent, LottieDirective } from 'ngx-lottie'
import { delay, filter, firstValueFrom, tap } from 'rxjs'

import { BubbleContainer } from '../../components/bubble-container/bubble-container'
import { RequestState } from '../../shared/enums/request-state.enum'
import { HighlightKeyPipe } from '../../shared/pipes/highlight-key.pipe'
import { SnackbarService } from '../../shared/services/snackbar.service'
import { GlobalStore } from '../../state/global.store'
import { GamePlayState } from './enums/game-play.enum'
import { SolvedTriad } from './interfaces/triad.interface'
import { GamePlayApi } from './services/game-play-api'
import { HintService } from './services/hint-service'
import { TurnService } from './services/turn-service'

@Component({
	selector: 'app-game-play',
	imports: [LottieComponent, ReactiveFormsModule, NgClass, BubbleContainer, LottieDirective, HighlightKeyPipe],
	templateUrl: './game-play.html',
	styleUrl: './game-play.scss',
})
export class GamePlay implements OnInit {
	readonly store = inject(GlobalStore)

	cueFetchingState = signal<RequestState>(RequestState.LOADING)

	keywordLengthHint = signal<string | null>(null)

	boxStatus = signal<'OPEN' | 'CLOSED'>('CLOSED')

	explodingBubbles = signal<string[]>([])

	// Popup: show solved cue words when the word box is clicked
	showSolvedPopup = signal<boolean>(false)

	solvedTriads = signal<SolvedTriad[]>([])

	isFetchingFinalTriadCues = signal<boolean>(false)

	availableTurns = computed(() => this.store.turns().filter((turn) => turn.available).length)

	ranOutOfTurns = computed(() => this.store.turns().filter((turn) => turn.available).length === 0)

	gameWon = computed(() => {
		return (
			this.store.cues() !== null &&
			this.store.cues()?.length === 0 &&
			this.store.finalTriadCues() !== null &&
			Array.isArray(this.store.finalTriadCues()) &&
			this.store.finalTriadCues()?.length === 0
		)
	})

	gameLost = computed(() => this.ranOutOfTurns() && !this.gameWon())

	gameScore = computed(() => {
		const solvedTriads = (9 - (this.store.cues()?.length ?? 0)) / 3
		const totalTriads = (this.store.cues()?.length ?? 0) / 3
		const totalAttempts = this.store.turns().filter((turn) => !turn.available).length + this.store.hints().filter((hint) => !hint.available).length

		// Perfect success scenarios
		if (solvedTriads === totalTriads) {
			return this.calculateSuccessScore(totalAttempts)
		}

		// Partial success scenarios
		return this.calculatePartialSuccessScore(solvedTriads)
	})

	solutionBox = viewChild.required<ElementRef>('solutionBox')

	hintUsed = false

	answerFormControl = new FormControl<string>('', { validators: [Validators.required] })

	boxAnimationItem: AnimationItem | null = null

	boxAnimationOptions: AnimationOptions = {
		path: 'lotties/box-lottie.json',
		autoplay: false,
		loop: false,
	}

	loadingAnimationOptions: AnimationOptions = {
		path: 'lotties/loading-lottie.json',
	}

	wrongAnswerAnimationOptions: AnimationOptions = {
		path: 'lotties/wrong-answer-lottie.json',
	}

	correctAnswerAnimationOptions: AnimationOptions = {
		path: 'lotties/correct-answer-lottie.json',
	}

	protected readonly RequestState = RequestState

	protected readonly length = length

	protected readonly GamePlayState = GamePlayState

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly turnService = inject(TurnService)

	private readonly hintService = inject(HintService)

	private readonly snackbarService = inject(SnackbarService)

	private readonly answerFieldRef = viewChild<ElementRef<HTMLInputElement>>('answerField')

	private readonly hintChoiceModalRef = viewChild<ElementRef<HTMLDialogElement>>('hintChoiceModal')

	constructor() {
		// Check for game end conditions
		effect(() => {
			if (this.gameWon()) {
				this.store.setGamePlayState(GamePlayState.WON)
			} else if (this.gameLost()) {
				this.store.setGamePlayState(GamePlayState.LOST)
			}
		})
	}

	ngOnInit() {
		this.initializeGame()
	}

	initializeGame() {
		this.gamePlayApi.getCues().subscribe({
			next: (cues) => {
				// this.store.setTriadsGroup({ id: cues.id, triads: cues.triads.map((triad) => ({ ...triad, available: true })) })
				this.store.setCues(cues)
				this.cueFetchingState.set(RequestState.READY)
				this.store.setGamePlayState(GamePlayState.PLAYING)
			},
		})
	}

	restartGame() {
		window.location.reload()
	}

	useHint(hintExtra?: 'KEYWORD_LENGTH' | 'FIRST_LETTER') {
		this.hintUsed = true
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
								this.keywordLengthHint.set(triadsForHint.withValue ?? null)
							} else if (triadsForHint.with === 'FIRST_LETTER' && triadsForHint.withValue) {
								this.answerFormControl.setValue(triadsForHint.withValue)
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

	checkTriad() {
		const selectedCues = this.store.selectedCues()

		if (selectedCues.length === 3) {
			this.gamePlayApi
				.checkTriad(selectedCues)
				.pipe(
					tap((success) => {
						if (success) {
							this.store.setGamePlayState(GamePlayState.ACCEPT_ANSWER)
							this.answerFieldRef()?.nativeElement.focus()
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

	submitAnswer() {
		const selectedCues = this.store.selectedCues()
		if (this.answerFormControl.valid && this.answerFormControl.value && selectedCues && selectedCues.length === 3) {
			this.gamePlayApi
				.checkAnswer(selectedCues, this.answerFormControl.value)
				.pipe(
					tap((success) => {
						if (success && typeof success !== 'boolean') {
							this.store.setGamePlayState(GamePlayState.CORRECT_ANSWER)
							this.store.selectedCues().forEach((cue) => this.moveToSolutionBox(cue))
							this.solvedTriads.update((currentValue) => [...currentValue, success])
						} else {
							this.store.setGamePlayState(GamePlayState.WRONG_ANSWER)
							if (!this.hintUsed) {
								this.useTurn()
							}
						}

						this.answerFormControl.reset()
					}),
					delay(3000),
				)
				.subscribe({
					next: (response) => {
						// Only change state if not in the WON or LOST state
						if (this.store.gamePlayState() !== GamePlayState.WON && this.store.gamePlayState() !== GamePlayState.LOST) {
							if (response && typeof response != 'boolean') {
								this.store.setSelectedCues([])
								this.store.removeSolvedCues(response.cues)
								this.store.setGamePlayState(GamePlayState.PLAYING)

								if (this.store.triadsStep() === 'INITIAL' && this.store.cues()?.length === 0) {
									this.store.updateTriadStep('FINAL')

									this.isFetchingFinalTriadCues.set(true)
									this.getFinalTriadCuesCues()
										.then((finalTriadCuesCues) => {
											this.store.setFinalTriadCues(finalTriadCuesCues)
										})
										.catch((error) => {
											console.error('Error fetching fourth triad:', error)
										})
										.finally(() => {
											this.isFetchingFinalTriadCues.set(false)
										})
								} else if (this.store.triadsStep() === 'FINAL') {
									this.store.setGamePlayState(GamePlayState.WON)
								} else {
									this.store.updateTriadStep('INITIAL')
								}
							} else {
								this.store.setGamePlayState(GamePlayState.ACCEPT_ANSWER)
								this.answerFieldRef()?.nativeElement.focus()
							}

							this.keywordLengthHint.set(null)
						}

						this.hintUsed = false
					},
				})
		}
	}

	animationCreated(animationItem: AnimationItem): void {
		this.boxAnimationItem = animationItem
	}

	toggleBoxStatus() {
		if (this.boxStatus() === 'OPEN') {
			this.closeSolutionsBox()
		} else {
			this.openSolutionsBox()
		}
	}

	openSolutionsBox(): void {
		if (this.boxStatus() === 'CLOSED') {
			this.boxAnimationItem?.play()
			this.boxStatus.set('OPEN')
		}
	}

	closeSolutionsBox(): void {
		if (this.boxStatus() === 'OPEN') {
			this.boxAnimationItem?.stop()
			this.boxStatus.set('CLOSED')
		}
	}

	onBoxClick() {
		if (this.boxStatus() === 'OPEN') {
			this.showSolvedPopup.set(false)
			this.closeSolutionsBox()
		} else {
			this.openSolutionsBox()
			this.boxAnimationItem?.addEventListener('complete', () => {
				this.showSolvedPopup.set(true)
				this.boxAnimationItem?.removeEventListener('complete')
			})
		}
	}

	closeSolvedPopup() {
		this.toggleBoxStatus()
		this.showSolvedPopup.set(false)
	}

	private async getFinalTriadCuesCues() {
		const solvedTriads = this.solvedTriads()
		return await firstValueFrom(this.gamePlayApi.fetchFinalTriadCues(solvedTriads.map((triad) => triad.id)))
	}

	private calculateSuccessScore(attempts: number): number {
		if (attempts === 0) return 15 // Perfect score
		if (attempts === 1) return 12 // 1 miss or hint
		if (attempts === 2) return 10 // 2 misses and/or hints
		return 10 // More than 2 attempts
	}

	private calculatePartialSuccessScore(solvedTriads: number): number {
		switch (solvedTriads) {
			case 3:
				return 8 // Got 3 triads, couldn't solve bonus
			case 2:
				return 6 // Got 2 triads
			case 1:
				return 3 // Got 1 triad
			default:
				return 0 // Went down in flames
		}
	}

	// private showTheFinalTriadCues() {
	// 	const finalTriadCuesCues = this.store.finalTriadCues()?.cues ?? []
	//
	// 	if (finalTriadCuesCues.length === 0) return
	//
	// 	this.openSolutionsBox()
	//
	// 	this.boxAnimationItem?.addEventListener('complete', () => {
	// 		finalTriadCuesCues.forEach((cue) => this.moveToBubblesContainer(cue.id))
	//
	// 		this.boxAnimationItem?.removeEventListener('complete')
	// 	})
	// }

	private useTurn() {
		try {
			const turnsAfterUsage = this.turnService.useTurn(this.store.turns())
			this.store.setTurns(turnsAfterUsage)
		} catch (error) {
			this.snackbarService.showSnackbar(`Error: ${(error as { message: string }).message ?? 'Unknown error'}`)
		}
	}

	private async moveToSolutionBox(cue: string) {
		this.openSolutionsBox()

		this.explodingBubbles.update((currentValue) => [...currentValue, cue])

		const bubbleSelector = `#bubble-${cue}`
		const solutionBox = this.solutionBox().nativeElement

		const point = MotionPathPlugin.convertCoordinates(solutionBox, document.querySelector(bubbleSelector) as Element, { x: 0, y: 0 })

		// gsap.to(bubbleSelector, { x: point.x, y: point.y });

		// or with '{ x: 0, y: 0 }' in the convertCoordinates method:
		await gsap.to(bubbleSelector, { delay: 0.5, duration: 3, x: '+=' + point.x, y: '+=' + point.y, scale: 0.5, opacity: 0.2, display: 'none' })
		this.closeSolutionsBox()
	}

	private moveToBubblesContainer(cueId: number) {
		const bubbleSelector = `#bubble-${cueId}`
		const solutionBox = this.solutionBox().nativeElement

		const point = MotionPathPlugin.convertCoordinates(solutionBox, document.querySelector(bubbleSelector) as Element, { x: 0, y: 0 })

		gsap.fromTo(bubbleSelector, { x: point.x, y: point.y, display: 'block' }, { x: 0, y: 0, display: 'block' }).then(() => {
			this.closeSolutionsBox()
		})
	}
}
