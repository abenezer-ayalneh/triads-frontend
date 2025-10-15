import { Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'

import { HowToPlay } from '../../pages/home/components/how-to-play/how-to-play'
import { GlobalStore } from '../../state/global.store'
import { Header } from './components/header/header'

@Component({
	selector: 'app-main-layout',
	imports: [RouterOutlet, HowToPlay, Header],
	templateUrl: './main-layout.html',
	styleUrl: './main-layout.scss',
})
export class MainLayout {
	readonly store = inject(GlobalStore)
}
