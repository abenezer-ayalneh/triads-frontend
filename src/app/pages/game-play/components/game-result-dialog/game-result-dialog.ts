import { Component, inject, input } from '@angular/core'
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

	readonly store = inject(GlobalStore)

	wonAnimationOptions: AnimationOptions = {
		path: 'lotties/correct-answer-lottie.json',
	}

	lostAnimationOptions: AnimationOptions = {
		path: 'lotties/wrong-answer-lottie.json',
	}

	restartGame() {
		window.location.reload()
	}
}
