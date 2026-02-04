import { afterNextRender, Component, output, signal } from '@angular/core'

import { Dialog } from '../dialog/dialog'

@Component({
	selector: 'app-quit-confirmation-dialog',
	imports: [Dialog],
	templateUrl: './quit-confirmation-dialog.html',
	styleUrl: './quit-confirmation-dialog.scss',
})
export class QuitConfirmationDialog {
	whenConfirmed = output<void>()

	whenCanceled = output<void>()

	isOpen = signal(true)

	constructor() {
		afterNextRender(() => {
			this.isOpen.set(true)
		})
	}

	onClose() {
		this.whenCanceled.emit()
	}

	onConfirmClick() {
		this.whenConfirmed.emit()
	}

	onBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			this.onClose()
		}
	}
}
