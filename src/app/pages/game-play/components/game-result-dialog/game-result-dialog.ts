import { Component, inject, input, output } from '@angular/core'
import { Router } from '@angular/router'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-game-result-dialog',
	imports: [LottieComponent],
	templateUrl: './game-result-dialog.html',
	styleUrl: './game-result-dialog.scss',
})
export class GameResultDialog {
	result = input.required<'WON' | 'LOST'>()

	restartRequested = output<void>()

	readonly store = inject(GlobalStore)

	private readonly router = inject(Router)

	wonAnimationOptions: AnimationOptions = {
		path: 'lotties/correct-answer-lottie.json',
	}

	lostAnimationOptions: AnimationOptions = {
		path: 'lotties/wrong-answer-lottie.json',
	}

	restartGame() {
		this.store.resetGameState()
		this.restartRequested.emit()
	}

	quitGame() {
		this.store.resetGameState()
		this.router.navigate(['/home'])
	}
}
