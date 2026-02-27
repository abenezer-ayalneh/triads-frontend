import { Component, inject, OnInit, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'

import { Dialog } from '../../shared/components/dialog/dialog'
import { GlobalStore } from '../../state/global.store'
import { UserInfoDialog } from './components/user-info-dialog/user-info-dialog'

@Component({
	selector: 'app-home',
	imports: [FormsModule, UserInfoDialog, RouterLink, Dialog],
	templateUrl: './home.page.html',
	styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
	readonly store = inject(GlobalStore)

	private static readonly GAME_INTRO_DISMISSED_KEY = 'triads.gameIntro.dismissed'

	showDebugDialog = signal(false)

	showGameIntroDialog = signal<boolean>(false)

	introDontShowAgain = signal<boolean>(false)

	ngOnInit() {
		this.initializeGameIntroDialog()
	}

	private initializeGameIntroDialog() {
		if (typeof window === 'undefined') {
			this.showGameIntroDialog.set(true)
			return
		}

		const isDismissed = window.localStorage.getItem(HomePage.GAME_INTRO_DISMISSED_KEY) === 'true'
		this.showGameIntroDialog.set(!isDismissed)
	}

	openDebugDialog() {
		this.showDebugDialog.set(true)
	}

	closeDebugDialog() {
		this.showDebugDialog.set(false)
	}

	onIntroDontShowAgainChange(checked: boolean) {
		this.introDontShowAgain.set(checked)
	}

	onIntroBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			this.onGameIntroDialogClosed()
		}
	}

	onGameIntroDialogClosed() {
		if (this.introDontShowAgain() && typeof window !== 'undefined') {
			window.localStorage.setItem(HomePage.GAME_INTRO_DISMISSED_KEY, 'true')
		}

		this.showGameIntroDialog.set(false)
	}
}
