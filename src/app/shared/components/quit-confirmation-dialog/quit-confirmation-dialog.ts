import { Component, output } from '@angular/core'

@Component({
	selector: 'app-quit-confirmation-dialog',
	imports: [],
	templateUrl: './quit-confirmation-dialog.html',
	styleUrl: './quit-confirmation-dialog.scss',
})
export class QuitConfirmationDialog {
	whenConfirmed = output<void>()

	whenCanceled = output<void>()

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
