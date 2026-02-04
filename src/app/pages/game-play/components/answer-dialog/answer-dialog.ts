import { afterNextRender, Component, input, signal } from '@angular/core'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

@Component({
	selector: 'app-answer-dialog',
	imports: [LottieComponent],
	templateUrl: './answer-dialog.html',
	styleUrl: './answer-dialog.scss',
})
export class AnswerDialog {
	type = input.required<'CORRECT' | 'WRONG'>()

	isOpen = signal(true)

	wrongAnswerAnimationOptions: AnimationOptions = {
		path: 'lotties/wrong-answer-lottie.json',
	}

	correctAnswerAnimationOptions: AnimationOptions = {
		path: 'lotties/correct-answer-lottie.json',
	}

	constructor() {
		afterNextRender(() => {
			this.isOpen.set(true)
		})
	}
}
