import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { gsap } from 'gsap'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

import { BubbleContainer } from '../../components/bubble-container/bubble-container'
import { RequestState } from '../../shared/enums/request-state.enum'
import { GlobalStore } from '../../state/global.store'
import { AnswerDialog } from './components/answer-dialog/answer-dialog'
import { BackgroundBubbles } from './components/background-bubbles/background-bubbles'
import { GameResultDialog } from './components/game-result-dialog/game-result-dialog'
import { HintsBox } from './components/hints-box/hints-box'
import { SolutionSection } from './components/solution-section/solution-section'
import { SolvedTriad } from './components/solved-triad/solved-triad'
import { TurnsBox } from './components/turns-box/turns-box'
import { GAME_END_MESSAGES, WRONG_MESSAGES } from './constants/game-play.constant'
import { GamePlayState } from './enums/game-play.enum'
import { SolvedTriad as SolvedTriadInterface } from './interfaces/triad.interface'
import { GamePlayApi } from './services/game-play-api'

@Component({
	selector: 'app-game-play',
	imports: [
		LottieComponent,
		ReactiveFormsModule,
		BackgroundBubbles,
		SolutionSection,
		TurnsBox,
		HintsBox,
		AnswerDialog,
		GameResultDialog,
		SolvedTriad,
		BubbleContainer,
	],
	templateUrl: './game-play.html',
	styleUrl: './game-play.scss',
})
export class GamePlay implements OnInit {
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

	protected readonly RequestState = RequestState

	protected readonly length = length

	protected readonly GamePlayState = GamePlayState

	private readonly gamePlayApi = inject(GamePlayApi)

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
