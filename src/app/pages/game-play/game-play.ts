import { Component, computed, effect, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { gsap } from 'gsap'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'
import { Subscription } from 'rxjs'

import { Intro } from '../../shared/components/intro/intro'
import { Difficulty } from '../../shared/enums/difficulty.enum'
import { RequestState } from '../../shared/enums/request-state.enum'
import { DifficultyService } from '../../shared/services/difficulty.service'
import { GlobalStore } from '../../state/global.store'
import { AnswerDialog } from './components/answer-dialog/answer-dialog'
import { BackgroundBubbles } from './components/background-bubbles/background-bubbles'
import { BubbleContainer } from './components/bubble-container/bubble-container'
import { GameResultDialog } from './components/game-result-dialog/game-result-dialog'
import { HintsBox } from './components/hints-box/hints-box'
import { SolutionSection } from './components/solution-section/solution-section'
import { SolvedTriad } from './components/solved-triad/solved-triad'
import { TurnsBox } from './components/turns-box/turns-box'
import { WelcomeDialog } from './components/welcome-dialog/welcome-dialog'
import { GAME_END_MESSAGES, WRONG_MESSAGES } from './constants/game-play.constant'
import { GamePlayState } from './enums/game-play.enum'
import { SolvedTriad as SolvedTriadInterface } from './interfaces/triad.interface'
import { GamePlayApi } from './services/game-play-api'
import { GamePlayLogic } from './services/game-play-logic'

@Component({
	selector: 'app-game-play',
	imports: [
		LottieComponent,
		ReactiveFormsModule,
		FormsModule,
		BackgroundBubbles,
		SolutionSection,
		TurnsBox,
		HintsBox,
		AnswerDialog,
		GameResultDialog,
		SolvedTriad,
		BubbleContainer,
		WelcomeDialog,
		Intro,
	],
	templateUrl: './game-play.html',
	styleUrl: './game-play.scss',
})
export class GamePlay implements OnInit, OnDestroy {
	readonly store = inject(GlobalStore)

	cueFetchingState = signal<RequestState>(RequestState.LOADING)

	explodingBubbles = signal<string[]>([])

	availableTurns = computed(() => this.store.turns().filter((turn) => turn.available).length)

	answerDialogMessage = computed(() => {
		const gameState = this.store.gamePlayState()

		if (gameState === GamePlayState.WRONG_ANSWER) {
			return this.generateWrongAnswerMessage()
		} else if (gameState === GamePlayState.WON || gameState === GamePlayState.LOST) {
			return this.generateGameResultMessage()
		}

		return ''
	})

	loadingAnimationOptions: AnimationOptions = {
		path: 'lotties/loading-lottie.json',
	}

	noTriadsMessage = signal<string>('')

	selectedDifficulty = signal<Difficulty>(Difficulty.RANDOM)

	showWelcomeDialog = signal<boolean>(false)

	welcomeDialogTotalPoints = signal<number>(0)

	protected readonly RequestState = RequestState

	protected readonly length = length

	protected readonly GamePlayState = GamePlayState

	protected readonly Difficulty = Difficulty

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly gamePlayLogic = inject(GamePlayLogic)

	private readonly difficultyService = inject(DifficultyService)

	private readonly router = inject(Router)

	private subscriptions$ = new Subscription()

	private readonly solutionSectionRef = viewChild<SolutionSection>('solutionSection')

	constructor() {
		// Watch for game completion to check if welcome dialog should be shown
		effect(() => {
			const gameState = this.store.gamePlayState()
			if (gameState === GamePlayState.WON || gameState === GamePlayState.LOST) {
				this.checkAndShowWelcomeDialog()
			}
		})
	}

	ngOnInit() {
		// Initialize selected difficulty with current setting
		this.selectedDifficulty.set(this.difficultyService.getDifficulty())
		this.initializeGame()
	}

	ngOnDestroy() {
		// Reset game state when navigating away from the gameplay page
		this.resetGameState()
	}

	initializeGame() {
		this.cueFetchingState.set(RequestState.LOADING)
		this.noTriadsMessage.set('')
		const difficulty = this.difficultyService.getDifficulty()
		this.subscriptions$.add(
			this.gamePlayApi.getCues(difficulty).subscribe({
				next: (response) => {
					// Check if cues is null or empty array (backend returns null when no triads found)
					if (!response.cues || response.cues.length === 0) {
						// Use backend message if available, otherwise generate a default message
						const message =
							response.message ||
							`No triads available for ${this.getDifficultyLabel(difficulty)} difficulty. Please try a different difficulty level.`
						this.noTriadsMessage.set(message)
						this.selectedDifficulty.set(difficulty)
						this.cueFetchingState.set(RequestState.EMPTY)
						return
					}
					// this.store.setTriadsGroup({ id: cues.id, triads: cues.triads.map((triad) => ({ ...triad, available: true })) })
					this.store.setCues(response.cues)
					this.store.setTriadGroupId(response.triadGroupId)
					this.cueFetchingState.set(RequestState.READY)
					this.store.setGamePlayState(GamePlayState.PLAYING)
				},
				error: () => {
					const difficultyLabel = this.getDifficultyLabel(difficulty)
					this.noTriadsMessage.set(
						`Unable to load triads for ${difficultyLabel} difficulty. Please try again or select a different difficulty level.`,
					)
					this.selectedDifficulty.set(difficulty)
					this.cueFetchingState.set(RequestState.ERROR)
				},
			}),
		)
	}

	retryGame() {
		// Use the selected difficulty from the dropdown and save it
		const selectedDifficulty = this.selectedDifficulty()
		this.difficultyService.setDifficulty(selectedDifficulty)
		this.initializeGame()
	}

	onDifficultyChange(difficulty: Difficulty) {
		this.selectedDifficulty.set(difficulty)
		// Update global difficulty value in localStorage immediately
		this.difficultyService.setDifficulty(difficulty)
	}

	goToHome() {
		this.router.navigate(['/home'])
	}

	restartGame() {
		// Reset all game state
		this.resetGameState()
		// Reinitialize the game
		this.initializeGame()
	}

	async moveToSolvedArea(solvedTriad: SolvedTriadInterface) {
		this.explodingBubbles.set(solvedTriad.cues)

		// Find the solved area element
		const solvedArea = document.getElementById(`solved-${solvedTriad.id}`)
		if (!solvedArea) return

		const allBubbles = Array.from(document.querySelectorAll('[id^="bubble-"]'))
		const bubbleAnimations: Promise<void>[] = []

		// Find all 3 bubble elements and create sequential animations
		for (let i = 0; i < solvedTriad.cues.length; i++) {
			const cue = solvedTriad.cues[i]
			let bubbleElement: Element | null = null

			// Find the bubble with the matching cue text
			for (const elem of allBubbles) {
				const cueElement = elem.querySelector('p')
				if (cueElement && cueElement.textContent?.trim() === cue) {
					bubbleElement = elem
					break
				}
			}

			if (!bubbleElement) continue

			// Calculate perfect alignment to the center of the solved-triad component
			const solvedAreaRect = solvedArea.getBoundingClientRect()
			const bubbleRect = bubbleElement.getBoundingClientRect()

			// Calculate the center position of the solved-triad component
			const targetX = solvedAreaRect.left + solvedAreaRect.width / 2 - bubbleRect.left
			const targetY = solvedAreaRect.top + solvedAreaRect.height / 2 - bubbleRect.top

			// Create sequential animation with delay between each bubble
			const animationPromise = new Promise<void>((resolve) => {
				gsap.to(bubbleElement, {
					delay: 0.5 + i * 0.2, // 0.2s delay between each bubble start (reduced from 0.4s)
					duration: 0.6, // Reduced from 1.2s to 0.6s (50% faster)
					x: targetX, // Perfect center alignment
					y: targetY,
					scale: 0.2,
					opacity: 0.1,
					ease: 'power2.inOut',
					onComplete: () => {
						// Hide the bubble after animation
						;(bubbleElement as HTMLElement).style.display = 'none'
						resolve()
					},
				})
			})

			bubbleAnimations.push(animationPromise)
		}

		// Wait for all animations to complete
		await Promise.all(bubbleAnimations)

		// Animate the solved-triad component appearance
		await this.animateSolvedTriadAppearance(solvedArea)
	}

	generateWrongAnswerMessage() {
		return WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]
	}

	generateGameResultMessage() {
		const gameScore = this.store.gameScore()
		return GAME_END_MESSAGES[gameScore]
	}

	checkAndShowWelcomeDialog() {
		const user = this.store.user()
		if (!user || !user.scores || user.welcomeMessageShown) {
			return
		}

		const totalGamesPlayed = Object.values(user.scores).reduce((sum, count) => sum + count, 0)
		if (totalGamesPlayed < 5) {
			return
		}

		const winCounts = Object.entries(user.scores).reduce((sum, [score, count]) => {
			const numericScore = Number(score)
			return numericScore > 0 ? sum + count : sum
		}, 0)

		const successRate = totalGamesPlayed > 0 ? winCounts / totalGamesPlayed : 0

		if (successRate >= 0.6) {
			this.welcomeDialogTotalPoints.set(Math.round(successRate * 100))
			this.showWelcomeDialog.set(true)

			const updatedUser = { ...user, welcomeMessageShown: true }
			this.store.setUser(updatedUser)
			this.store.userService.setUser(updatedUser)
		}
	}

	onWelcomeDialogClosed() {
		this.showWelcomeDialog.set(false)
	}

	private resetGameState() {
		// Clear existing subscriptions to avoid memory leaks
		this.subscriptions$.unsubscribe()
		// Create a new subscription object
		this.subscriptions$ = new Subscription()
		// Reset local component state
		this.cueFetchingState.set(RequestState.LOADING)
		this.explodingBubbles.set([])
		this.noTriadsMessage.set('')
		this.showWelcomeDialog.set(false)
		this.welcomeDialogTotalPoints.set(0)
		// Reset GamePlayLogic BehaviorSubjects
		this.gamePlayLogic.resetAnswerFieldState()
		// Reset SolutionSection component state
		const solutionSection = this.solutionSectionRef()
		if (solutionSection) {
			solutionSection.resetComponentState()
		}
		// Reset global store game state
		this.store.setUnsolvedTriads(null)
		this.store.resetGameState()
	}

	private getDifficultyLabel(difficulty: string): string {
		const labels: Record<string, string> = {
			EASY: 'Soft',
			MEDIUM: 'Firm',
			HARD: 'Hard',
			RANDOM: 'Mixed (complete)',
		}
		return labels[difficulty] || difficulty
	}

	private async animateSolvedTriadAppearance(solvedArea: HTMLElement) {
		// Start with the solved component hidden and small
		gsap.set(solvedArea, { scale: 0, opacity: 0 })

		// Animate it to appear with a bounce effect
		await gsap.to(solvedArea, {
			duration: 0.8,
			scale: 1,
			opacity: 0.65,
			ease: 'back.out(1.7)',
		})
	}
}
