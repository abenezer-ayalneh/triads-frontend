import { Component, inject, signal } from '@angular/core'
import { IonModal } from '@ionic/angular/standalone'

import { GlobalStore } from '../../../state/global.store'
import { Dialog } from '../dialog/dialog'
import { GAME_INTRO_DISMISSED_KEY } from './intro-constant'

@Component({
	selector: 'app-intro',
	imports: [IonModal, Dialog],
	templateUrl: './intro.html',
	styleUrl: './intro.scss',
})
export class Intro {
	readonly store = inject(GlobalStore)

	dontShowAgain = signal<boolean>(false)

	onIntroDontShowAgainChange(checked: boolean) {
		this.dontShowAgain.set(checked)
	}

	onGameIntroDialogClosed() {
		if (this.dontShowAgain() && typeof window !== 'undefined') {
			localStorage.setItem(GAME_INTRO_DISMISSED_KEY, 'true')
		}

		this.store.setIntroShownPerSession(true)
	}
}
