import { Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'

import { HowToPlay } from '../../pages/home/components/how-to-play/how-to-play'
import { GlobalStore } from '../../state/global.store'

@Component({
	selector: 'app-main-layout',
	imports: [RouterOutlet, HowToPlay],
	templateUrl: './main-layout.html',
	styleUrl: './main-layout.scss',
})
export class MainLayout {
	protected readonly store = inject(GlobalStore)

	toggleHowToPlay() {
		this.store.setShowHowToPlay(true)
	}
}
