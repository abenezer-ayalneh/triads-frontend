import { Component, computed, inject, model, OnDestroy, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatTooltip } from '@angular/material/tooltip'
import { NavigationEnd, Router } from '@angular/router'
import { filter, Subscription } from 'rxjs'

import { ClickOutsideDirective } from '../../../../shared/directives/click-outside'
import { UserService } from '../../../../shared/services/user.service'
import { GlobalStore } from '../../../../state/global.store'
import { Stats } from '../stats/stats'

@Component({
	selector: 'app-header',
	imports: [Stats, MatTooltip, FormsModule, ClickOutsideDirective],
	templateUrl: './header.html',
	styleUrl: './header.scss',
})
export class Header implements OnDestroy {
	readonly store = inject(GlobalStore)

	private readonly router = inject(Router)

	private readonly userService = inject(UserService)

	showStats = signal<boolean>(false)

	showUsernameDropdown = signal<boolean>(false)

	editedUsername = model<string>('')

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

	toggleUsernameDropdown() {
		if (!this.showUsernameDropdown()) {
			this.editedUsername.set(this.store.user()?.username ?? '')
		}
		this.showUsernameDropdown.update((value) => !value)
	}

	closeUsernameDropdown() {
		this.showUsernameDropdown.set(false)
		this.editedUsername.set('')
	}

	updateUsername() {
		const newUsername = this.editedUsername()?.trim() ?? ''
		const currentUser = this.store.user()

		if (newUsername && newUsername.length >= 3 && currentUser) {
			const updatedUser = {
				...currentUser,
				username: newUsername,
			}
			this.userService.setUser(updatedUser)
			this.store.setUser(updatedUser)
			this.closeUsernameDropdown()
		}
	}

	cancelUsernameUpdate() {
		this.closeUsernameDropdown()
	}
}
