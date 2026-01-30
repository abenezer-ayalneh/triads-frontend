import { CommonModule } from '@angular/common'
import { Component, ElementRef, inject } from '@angular/core'

import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-how-to-play',
	imports: [CommonModule],
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

	onClose() {
		this.store.setShowHowToPlay(false)
	}

	onBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			this.onClose()
		}
	}
}
