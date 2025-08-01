import { CommonModule } from '@angular/common'
import { Component, ElementRef, inject, OnInit } from '@angular/core'

import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-how-to-play',
	imports: [CommonModule],
	templateUrl: './how-to-play.html',
	styleUrl: './how-to-play.scss',
})
export class HowToPlay implements OnInit {
	readonly store = inject(GlobalStore)

	readonly elementRef = inject(ElementRef)

	readonly scoringData = [
		{ outcome: 'A perfect score. No misses, no hints', points: 10 },
		{ outcome: 'Success, but with either 1 miss or 1 hint', points: 8 },
		{ outcome: 'Success, with 2 misses and/or hints', points: 6 },
		{ outcome: "Got 2 out of 3, just couldn't get that last one", points: 4 },
		{ outcome: "Got 1 Triad but couldn't get the other 2", points: 2 },
		{ outcome: 'Went down in flames. No success at all', points: 0 },
	]

	ngOnInit() {
		document.body.appendChild(this.elementRef.nativeElement)
	}

	onClose() {
		this.store.setShowHowToPlay(false)
	}

	onBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			this.onClose()
		}
	}
}
