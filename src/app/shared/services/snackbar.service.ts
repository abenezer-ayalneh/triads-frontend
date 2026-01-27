import { inject, Injectable } from '@angular/core'
import { ToastController } from '@ionic/angular/standalone'

@Injectable({
	providedIn: 'root',
})
export class SnackbarService {
	private readonly toastController = inject(ToastController)

	async showSnackbar(message: string, duration = 10000) {
		const toast = await this.toastController.create({
			message,
			duration,
			position: 'top',
			buttons: [
				{
					text: 'Close',
					role: 'cancel',
				},
			],
		})
		await toast.present()
	}
}
