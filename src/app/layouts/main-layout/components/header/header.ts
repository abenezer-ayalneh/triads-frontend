import { Component, computed, inject, OnDestroy, signal } from '@angular/core'
import { MatTooltip } from '@angular/material/tooltip'
import { NavigationEnd, Router, RouterLink } from '@angular/router'
import { filter, Subscription } from 'rxjs'

import { GlobalStore } from '../../../../state/global.store'
import { Stats } from '../stats/stats'

@Component({
	selector: 'app-header',
	imports: [Stats, RouterLink, MatTooltip],
	templateUrl: './header.html',
	styleUrl: './header.scss',
})
export class Header implements OnDestroy {
	readonly store = inject(GlobalStore)

	private readonly router = inject(Router)

	showStats = signal<boolean>(false)

	currentUrl = signal<string>(this.router.url)

	private readonly routerSubscription: Subscription

	// Show quit button when not on home page
	isHomePage = computed(() => {
		const url = this.currentUrl()
		return url === '/home' || url === '/'
	})

	constructor() {
		// Track route changes
		this.routerSubscription = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
			if (event instanceof NavigationEnd) {
				this.currentUrl.set(event.urlAfterRedirects)
			}
		})
	}

	ngOnDestroy() {
		this.routerSubscription?.unsubscribe()
	}

	quitGame() {
		this.router.navigate(['/home'])
	}

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
