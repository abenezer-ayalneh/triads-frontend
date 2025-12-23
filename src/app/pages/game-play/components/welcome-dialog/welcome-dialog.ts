import { Component, input, output } from '@angular/core'

@Component({
	selector: 'app-welcome-dialog',
	imports: [],
	templateUrl: './welcome-dialog.html',
	styleUrl: './welcome-dialog.scss',
})
export class WelcomeDialog {
	totalPoints = input.required<number>()

	whenClosed = output<void>()

	getMessage(): string {
		const points = this.totalPoints()

		if (points >= 50) {
			return "You're really quite good at this game! If you want a greater challenge, you can move to Firm (medium difficulty) or Hard (really tough) level by clicking your name, then selecting the difficulty level."
		} else if (points >= 40 && points <= 49) {
			return "You've caught on to Triads quite well. Remember, you can select any difficulty level by clicking your name and choosing your preference."
		} else if (points >= 30 && points <= 39) {
			return "Players find Triads to get easier, the more games they play. You're off to a good start!"
		} else if (points >= 20 && points <= 29) {
			return "Don't get discouraged when you can't figure out a Triads game. Players get better with each game."
		} else {
			return 'Triads gets easier the more you play it. Hang in there, and watch your skill level improve.'
		}
	}

	onClose() {
		this.whenClosed.emit()
	}

	onBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			this.onClose()
		}
	}
}
