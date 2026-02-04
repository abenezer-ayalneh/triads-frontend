import { Component, inject, output, signal } from '@angular/core'

import { UserService } from '../../services/user.service'
import { Dialog } from '../dialog/dialog'

@Component({
	selector: 'app-new-identity-dialog',
	imports: [Dialog],
	templateUrl: './new-identity-dialog.html',
	styleUrl: './new-identity-dialog.scss',
})
export class NewIdentityDialog {
	whenClosingDialog = output()

	showDataClearingConfirmation = signal<boolean>(false)

	private readonly userService = inject(UserService)

	resetData() {
		this.userService.clearUserData()
		window.location.reload()
	}

	toggleDataClearingConfirmation() {
		this.showDataClearingConfirmation.update((currentValue) => !currentValue)
	}

	onClose() {
		this.whenClosingDialog.emit()
	}

	onBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			this.onClose()
		}
	}
}
