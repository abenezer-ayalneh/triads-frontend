import { Component, computed, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { AnimationItem } from 'lottie-web'
import { AnimationOptions, LottieComponent, LottieDirective } from 'ngx-lottie'

import { BubbleContainer } from '../../components/bubble-container/bubble-container'
import { RequestState } from '../../shared/enums/request-state.enum'
import { GlobalStore } from '../../state/global.store'
import { AnswerDialog } from './components/answer-dialog/answer-dialog'
import { BackgroundBubbles } from './components/background-bubbles/background-bubbles'
import { GameResultDialog } from './components/game-result-dialog/game-result-dialog'
import { HintsBox } from './components/hints-box/hints-box'
import { SolutionSection } from './components/solution-section/solution-section'
import { TurnsBox } from './components/turns-box/turns-box'
import { GamePlayState } from './enums/game-play.enum'
import { GamePlayApi } from './services/game-play-api'
import { GamePlayLogic } from './services/game-play-logic'

@Component({
	selector: 'app-game-play',
	imports: [
		LottieComponent,
		ReactiveFormsModule,
		BubbleContainer,
		LottieDirective,
		BackgroundBubbles,
		SolutionSection,
		TurnsBox,
		HintsBox,
		AnswerDialog,
		GameResultDialog,
	],
	templateUrl: './game-play.html',
	styleUrl: './game-play.scss',
})
export class GamePlay implements OnInit {
	readonly store = inject(GlobalStore)

	cueFetchingState = signal<RequestState>(RequestState.LOADING)

	boxStatus = signal<'OPEN' | 'CLOSED'>('CLOSED')

	explodingBubbles = signal<string[]>([])

	// Popup: show solved cue words when the word box is clicked
	showSolvedPopup = signal<boolean>(false)

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

	solutionBox = viewChild.required<ElementRef>('solutionBox')

	boxAnimationItem: AnimationItem | null = null

	boxAnimationOptions: AnimationOptions = {
		path: 'lotties/box-lottie.json',
		autoplay: false,
		loop: false,
	}

	loadingAnimationOptions: AnimationOptions = {
		path: 'lotties/loading-lottie.json',
	}

	protected readonly RequestState = RequestState

	protected readonly length = length

	protected readonly GamePlayState = GamePlayState

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly gamePlayLogic = inject(GamePlayLogic)

	constructor() {
		// Check for game end conditions
		effect(() => {
			if (this.gameWon()) {
				this.gamePlayLogic.handleGameWon()
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

	animationCreated(animationItem: AnimationItem): void {
		this.boxAnimationItem = animationItem
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

	async moveToSolutionBox(cue: string) {
		this.openSolutionsBox()

		this.explodingBubbles.update((currentValue) => [...currentValue, cue])

		// Find the bubble by its text content instead of ID to handle multi-word phrases
		const solutionBox = this.solutionBox().nativeElement

		// Find all bubble elements
		const allBubbles = Array.from(document.querySelectorAll('[id^="bubble-"]'))
		let bubbleElement: Element | null = null

		// Find the bubble with the matching cue text
		for (const elem of allBubbles) {
			const cueElement = elem.querySelector('p')
			if (cueElement && cueElement.textContent?.trim() === cue) {
				bubbleElement = elem
				break
			}
		}

		// If no matching bubble found, exit
		if (!bubbleElement) {
			return
		}

		const point = MotionPathPlugin.convertCoordinates(solutionBox, bubbleElement, { x: 0, y: 0 })

		// Animate the bubble to the solution box
		await gsap.to(bubbleElement, {
			delay: 0.5,
			duration: 3,
			x: '+=' + point.x,
			y: '+=' + point.y,
			scale: 0.5,
			opacity: 0.2,
			display: 'none',
		})

		this.closeSolutionsBox()
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

	private moveToBubblesContainer(cueId: number) {
		// For numeric IDs, the selector approach still works fine
		const bubbleSelector = `#bubble-${cueId}`
		const solutionBox = this.solutionBox().nativeElement
		const bubbleElement = document.querySelector(bubbleSelector)

		if (!bubbleElement) {
			return
		}

		const point = MotionPathPlugin.convertCoordinates(solutionBox, bubbleElement, { x: 0, y: 0 })

		gsap.fromTo(bubbleElement, { x: point.x, y: point.y, display: 'block' }, { x: 0, y: 0, display: 'block' }).then(() => {
			this.closeSolutionsBox()
		})
	}
}
