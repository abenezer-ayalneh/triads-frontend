import { afterNextRender, Component, input, output, signal } from '@angular/core'

import { Dialog } from '../../../../shared/components/dialog/dialog'

@Component({
	selector: 'app-welcome-dialog',
	imports: [Dialog],
	templateUrl: './welcome-dialog.html',
	styleUrl: './welcome-dialog.scss',
})
export class WelcomeDialog {
	totalPoints = input.required<number>()

	whenClosed = output<void>()

	isOpen = signal(true)

	constructor() {
		afterNextRender(() => {
			this.isOpen.set(true)
		})
	}

	getMessage(): string {
		return 'You’re good at Triads!  Remember, you can click your name to change the difficulty level at any time.'
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
