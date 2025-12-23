import { Component, effect, inject, input, output, signal } from '@angular/core'
import { Router } from '@angular/router'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

import { GlobalStore } from '../../../../state/global.store'
import { SolutionReveal } from '../solution-reveal/solution-reveal'

@Component({
	selector: 'app-game-result-dialog',
	imports: [LottieComponent, SolutionReveal],
	templateUrl: './game-result-dialog.html',
	styleUrl: './game-result-dialog.scss',
})
export class GameResultDialog {
	result = input.required<'WON' | 'LOST'>()

	restartRequested = output<void>()

	readonly store = inject(GlobalStore)

	private readonly router = inject(Router)

	showPlayAgainButton = signal(false)

	showConfetti = signal(false)

	private readonly taDahAudio = new Audio()

	constructor() {
		this.taDahAudio.src = 'sounds/ta-dah.mp3'
		this.taDahAudio.volume = 0.7

		// Watch for game state and unsolved triads to show button
		effect(() => {
			const result = this.result()
			const unsolvedTriads = this.store.unsolvedTriads()
			const gameScore = this.store.gameScore()

			if (result === 'LOST') {
				// For LOST state, show button after solutions appear (or after max 2 seconds)
				if (unsolvedTriads && unsolvedTriads.length > 0) {
					// Solutions are available, show button after short delay
					setTimeout(() => {
						this.showPlayAgainButton.set(true)
					}, 500)
				} else {
					// No solutions yet, show button after max 2 seconds
					setTimeout(() => {
						this.showPlayAgainButton.set(true)
					}, 2000)
				}
			} else if (result === 'WON') {
				// For WON state, show button immediately
				this.showPlayAgainButton.set(true)

				// Check if perfect score (15) - trigger celebration
				if (gameScore === 15) {
					// Play ta-dah sound effect
					this.taDahAudio.play().catch((error) => {
						// Silently fail if audio can't play (e.g., user interaction required)
						console.warn('Could not play celebration sound:', error)
					})

					// Show confetti for 2 seconds
					this.showConfetti.set(true)
				}
			}
		})
	}

	wonAnimationOptions: AnimationOptions = {
		path: 'lotties/correct-answer-lottie.json',
	}

	lostAnimationOptions: AnimationOptions = {
		path: 'lotties/wrong-answer-lottie.json',
	}

	confettiAnimationOptions: AnimationOptions = {
		path: 'lotties/bubble-burst-confetti.json',
		loop: true,
	}

	restartGame() {
		this.store.setUnsolvedTriads(null)
		this.store.resetGameState()
		this.showPlayAgainButton.set(false)
		this.restartRequested.emit()
	}

	quitGame() {
		this.store.setUnsolvedTriads(null)
		this.store.resetGameState()
		this.showPlayAgainButton.set(false)
		this.router.navigate(['/home'])
	}
}
