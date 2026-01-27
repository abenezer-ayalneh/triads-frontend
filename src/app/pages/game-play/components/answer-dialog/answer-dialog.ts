import { afterNextRender, Component, input, signal } from '@angular/core'
import { IonContent, IonModal } from '@ionic/angular/standalone'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

@Component({
	selector: 'app-answer-dialog',
	imports: [IonModal, IonContent, LottieComponent],
	templateUrl: './answer-dialog.html',
	styleUrl: './answer-dialog.scss',
})
export class AnswerDialog {
	type = input.required<'CORRECT' | 'WRONG'>()

	isOpen = signal(true)

	constructor() {
		afterNextRender(() => {
			this.isOpen.set(true)
		})
	}

	wrongAnswerAnimationOptions: AnimationOptions = {
		path: 'lotties/wrong-answer-lottie.json',
	}

	correctAnswerAnimationOptions: AnimationOptions = {
		path: 'lotties/correct-answer-lottie.json',
	}
}
