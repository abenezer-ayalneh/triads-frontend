import { Component, effect, inject, input, output, signal } from '@angular/core'
import { Router } from '@angular/router'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

import { SnackbarService } from '../../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../../state/global.store'
import { SolutionReveal } from '../solution-reveal/solution-reveal'

@Component({
	selector: 'app-game-result-dialog',
	imports: [LottieComponent, SolutionReveal],
	templateUrl: './game-result-dialog.html',
})
export class GameResultDialog {
	result = input.required<'WON' | 'LOST'>()

	restartRequested = output<void>()

	readonly store = inject(GlobalStore)

	private readonly router = inject(Router)

	private readonly snackbarService = inject(SnackbarService)

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

	async shareGameResult() {
		try {
			const solvedTriads = this.store.solvedTriads()
			const triadsStep = this.store.triadsStep()
			const gameResult = this.result()
			const turns = this.store.turns()
			const gameScore = this.store.gameScore()

			// Calculate tries used
			const triesUsed = 3 - turns.filter((turn) => turn.available).length

			// Determine triad status
			const solvedCount = solvedTriads.length
			const isFourthTriadSolved = triadsStep === 'FINAL' && gameResult === 'WON'

			// Build emoji representation
			const emojis: string[] = []
			for (let i = 1; i <= 4; i++) {
				if (i <= 3) {
					// First 3 triads
					emojis.push(solvedCount >= i ? '✅' : '⬛️')
				} else {
					// 4th triad (bonus)
					// Try to use a larger variant if available, otherwise use the same emoji
					const baseEmoji = isFourthTriadSolved ? '✅' : '⬛️'
					// Attempt to use larger variant - for now, use the same emoji
					// In the future, could check for larger Unicode variants
					emojis.push(baseEmoji)
				}
			}

			// Format the share text
			const date = new Date().toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			})
			const resultEmoji = gameResult === 'WON' ? '🎉' : '😔'
			const resultText = gameResult === 'WON' ? 'Won!' : 'Lost!'

			const shareText = `Triads ${date}\n${emojis.join(' ')}\nTries Used: ${triesUsed}/3\nScore: ${gameScore}\n${resultEmoji} ${resultText}`

			// Copy to clipboard
			await navigator.clipboard.writeText(shareText)
			this.snackbarService.showSnackbar('Game result copied to clipboard!', 3000)
		} catch (error) {
			console.error('Failed to copy game result to clipboard:', error)
			this.snackbarService.showSnackbar('Failed to copy game result. Please try again.', 5000)
		}
	}
}
