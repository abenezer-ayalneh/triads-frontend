import { Component, input } from '@angular/core'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

@Component({
	selector: 'app-answer-dialog',
	imports: [LottieComponent],
	templateUrl: './answer-dialog.html',
	styleUrl: './answer-dialog.scss',
})
export class AnswerDialog {
	type = input.required<'CORRECT' | 'WRONG'>()

	wrongAnswerAnimationOptions: AnimationOptions = {
		path: 'lotties/wrong-answer-lottie.json',
	}

	correctAnswerAnimationOptions: AnimationOptions = {
		path: 'lotties/correct-answer-lottie.json',
	}
}
