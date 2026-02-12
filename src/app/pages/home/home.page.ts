import { Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'

import { GlobalStore } from '../../state/global.store'
import { UserInfoDialog } from './components/user-info-dialog/user-info-dialog'

@Component({
	selector: 'app-home',
	imports: [FormsModule, UserInfoDialog, RouterLink],
	templateUrl: './home.page.html',
	styleUrl: './home.page.scss',
})
export class HomePage {
	readonly store = inject(GlobalStore)

	showDebugDialog = signal(false)

	openDebugDialog() {
		this.showDebugDialog.set(true)
	}

	closeDebugDialog() {
		this.showDebugDialog.set(false)
	}
}
