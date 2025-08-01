import { inject, Injectable } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'

@Injectable({
	providedIn: 'root',
})
export class SnackbarService {
	private readonly snackbar = inject(MatSnackBar)

	showSnackbar(message: string, duration = 10000) {
		this.snackbar.open(message, 'Close', { horizontalPosition: 'end', verticalPosition: 'top', duration })
	}
}
