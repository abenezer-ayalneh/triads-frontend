import { Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router } from '@angular/router'
import { IonContent, IonHeader, IonRouterOutlet, IonToolbar } from '@ionic/angular/standalone'
import { filter, map } from 'rxjs'

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

	private readonly router = inject(Router)

	private readonly currentUrl = toSignal(
		this.router.events.pipe(
			filter((e): e is NavigationEnd => e instanceof NavigationEnd),
			map((e) => e.urlAfterRedirects),
		),
		{ initialValue: this.router.url },
	)

	readonly overlayVisible = computed(() => {
		const url = this.currentUrl()
		const onHome = url === '/home' || url === '/'
		return this.store.showHowToPlay() || (onHome && !this.store.user())
	})
}
