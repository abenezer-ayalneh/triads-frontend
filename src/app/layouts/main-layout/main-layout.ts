import { Component, inject } from '@angular/core'
import { IonContent, IonHeader, IonRouterOutlet, IonToolbar } from '@ionic/angular/standalone'

import { HowToPlay } from '../../pages/home/components/how-to-play/how-to-play'
import { GlobalStore } from '../../state/global.store'
import { Header } from './components/header/header'

@Component({
	selector: 'app-main-layout',
	imports: [HowToPlay, Header, IonHeader, IonContent, IonToolbar, IonRouterOutlet],
	templateUrl: './main-layout.html',
	styleUrl: './main-layout.scss',
})
export class MainLayout {
	readonly store = inject(GlobalStore)
}
