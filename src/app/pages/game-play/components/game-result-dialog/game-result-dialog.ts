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

	constructor() {
		// Watch for game state and unsolved triads to show button
		effect(() => {
			const result = this.result()
			const unsolvedTriads = this.store.unsolvedTriads()

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
			}
		})
	}

	wonAnimationOptions: AnimationOptions = {
		path: 'lotties/correct-answer-lottie.json',
	}

	lostAnimationOptions: AnimationOptions = {
		path: 'lotties/wrong-answer-lottie.json',
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
