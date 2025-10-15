import { Component, inject, signal } from '@angular/core'

import { GlobalStore } from '../../../../state/global.store'
import { Stats } from '../stats/stats'

@Component({
	selector: 'app-header',
	imports: [Stats],
	templateUrl: './header.html',
	styleUrl: './header.scss',
})
export class Header {
	readonly store = inject(GlobalStore)

	showStats = signal<boolean>(false)

	toggleStatusWindow() {
		this.showStats.update((currentValue) => !currentValue)
	}

	closeStatsWindow() {
		this.showStats.set(false)
	}

	showHowToPlay() {
		this.store.setShowHowToPlay(true)
	}
}
