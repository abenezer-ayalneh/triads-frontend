import { afterNextRender, Component, computed, inject, input, signal } from '@angular/core'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

import { AssetPreloadService } from '../../../../shared/services/asset-preload.service'

const WRONG_ANSWER_LOTTIE_PATH = 'lotties/wrong-answer-lottie.json'
const CORRECT_ANSWER_LOTTIE_PATH = 'lotties/correct-answer-lottie.json'

@Component({
	selector: 'app-answer-dialog',
	imports: [LottieComponent],
	templateUrl: './answer-dialog.html',
	styleUrl: './answer-dialog.scss',
})
export class AnswerDialog {
	type = input.required<'CORRECT' | 'WRONG'>()

	isOpen = signal(true)

	private readonly assetPreloadService = inject(AssetPreloadService)

	readonly wrongAnswerAnimationOptions = computed<AnimationOptions>(() => {
		this.assetPreloadService.lottieVersion()
		const animationData = this.assetPreloadService.getLottie(WRONG_ANSWER_LOTTIE_PATH)
		return animationData ? { animationData } : { path: WRONG_ANSWER_LOTTIE_PATH }
	})

	readonly correctAnswerAnimationOptions = computed<AnimationOptions>(() => {
		this.assetPreloadService.lottieVersion()
		const animationData = this.assetPreloadService.getLottie(CORRECT_ANSWER_LOTTIE_PATH)
		return animationData ? { animationData } : { path: CORRECT_ANSWER_LOTTIE_PATH }
	})

	constructor() {
		afterNextRender(() => {
			this.isOpen.set(true)
		})
	}
}
