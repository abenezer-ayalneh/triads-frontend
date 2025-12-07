import { Component, output } from '@angular/core'

@Component({
	selector: 'app-delete-confirmation-dialog',
	standalone: true,
	imports: [],
	templateUrl: './delete-confirmation-dialog.html',
	styleUrl: './delete-confirmation-dialog.scss',
})
export class DeleteConfirmationDialog {
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
