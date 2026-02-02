import { CommonModule } from '@angular/common'
import { Component, ElementRef, inject, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonModal } from '@ionic/angular/standalone'
import { OverlayEventDetail } from '@ionic/core/components'

import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-how-to-play',
	imports: [CommonModule, IonModal, FormsModule],
	templateUrl: './how-to-play.html',
	styleUrl: './how-to-play.scss',
})
export class HowToPlay {
	readonly store = inject(GlobalStore)

	readonly elementRef = inject(ElementRef)

	readonly scoringData = [
		{ outcome: 'A perfect score! Got all 4 Triads with no misses, no hints', points: 15 },
		{ outcome: 'Success (all 4 solved) but with either 1 miss or 1 hint', points: 12 },
		{ outcome: 'Success (all 4), but with 2 misses and/or hints', points: 10 },
		{ outcome: 'Got 3 Triads, but just couldn’t solve the bonus', points: 8 },
		{ outcome: 'Got 2 Triads but couldn’t get the 3rd, no bonus round', points: 6 },
		{ outcome: 'Got 1 Triad before using up all 3 turns', points: 3 },
	]

	@ViewChild(IonModal) modal!: IonModal

	message = 'This modal example uses triggers to automatically open a modal when the button is clicked.'

	name!: string

	onClose() {
		this.store.setShowHowToPlay(false)
	}

	onBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			this.onClose()
		}
	}

	cancel() {
		this.modal.dismiss(null, 'cancel')
	}

	confirm() {
		this.modal.dismiss(this.name, 'confirm')
	}

	onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
		if (event.detail.role === 'confirm') {
			this.message = `Hello, ${event.detail.data}!`
		}
	}
}
