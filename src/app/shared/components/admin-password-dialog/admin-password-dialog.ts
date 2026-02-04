import { Component, inject, output, signal } from '@angular/core'

import { AdminAuthService } from '../../services/admin-auth.service'
import { Dialog } from '../dialog/dialog'

@Component({
	selector: 'app-admin-password-dialog',
	imports: [Dialog],
	templateUrl: './admin-password-dialog.html',
	styleUrl: './admin-password-dialog.scss',
})
export class AdminPasswordDialog {
	whenAuthenticated = output()

	whenCanceled = output()

	password = signal<string>('')

	errorMessage = signal<string>('')

	private readonly adminAuthService = inject(AdminAuthService)

	onSubmit() {
		const passwordValue = this.password().trim()
		if (!passwordValue) {
			this.errorMessage.set('Please enter a password')
			return
		}

		if (this.adminAuthService.authenticate(passwordValue)) {
			this.whenAuthenticated.emit()
			this.onClose()
		} else {
			this.errorMessage.set('Incorrect password')
			this.password.set('')
		}
	}

	onClose() {
		this.password.set('')
		this.errorMessage.set('')
		this.whenCanceled.emit()
	}

	onBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			this.onClose()
		}
	}
}
