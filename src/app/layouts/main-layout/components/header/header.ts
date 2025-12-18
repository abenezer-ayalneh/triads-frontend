import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatTooltip } from '@angular/material/tooltip'
import { NavigationEnd, Router } from '@angular/router'
import { filter, Subscription } from 'rxjs'

import { AdminPasswordDialog } from '../../../../shared/components/admin-password-dialog/admin-password-dialog'
import { NewIdentityDialog } from '../../../../shared/components/new-identity-dialog/new-identity-dialog'
import { QuitConfirmationDialog } from '../../../../shared/components/quit-confirmation-dialog/quit-confirmation-dialog'
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside'
import { Difficulty } from '../../../../shared/enums/difficulty.enum'
import { AdminAuthService } from '../../../../shared/services/admin-auth.service'
import { DifficultyService } from '../../../../shared/services/difficulty.service'
import { GlobalStore } from '../../../../state/global.store'
import { Stats } from '../stats/stats'

@Component({
	selector: 'app-header',
	imports: [Stats, MatTooltip, ClickOutsideDirective, QuitConfirmationDialog, NewIdentityDialog, AdminPasswordDialog, FormsModule],
	templateUrl: './header.html',
	styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
	readonly store = inject(GlobalStore)

	private readonly router = inject(Router)

	private readonly adminAuthService = inject(AdminAuthService)

	private readonly difficultyService = inject(DifficultyService)

	showStats = signal<boolean>(false)

	showUsernameDropdown = signal<boolean>(false)

	showQuitConfirmation = signal<boolean>(false)

	showNewIdentityDialog = signal<boolean>(false)

	showAdminPasswordDialog = signal<boolean>(false)

	showAdminOption = signal<boolean>(false)

	currentUrl = signal<string>(this.router.url)

	selectedDifficulty = signal<Difficulty>(this.difficultyService.getDifficulty())

	readonly Difficulty = Difficulty

	isAdminAuthenticated = computed(() => this.adminAuthService.isAuthenticated())

	private readonly routerSubscription: Subscription

	// Show quit button when not on home page
	isHomePage = computed(() => {
		const url = this.currentUrl()
		return url === '/home' || url === '/'
	})

	// Check if on gameplay page
	isGameplayPage = computed(() => {
		const url = this.currentUrl()
		return url === '/play'
	})

	// Check if on manage triads page
	isManageTriadsPage = computed(() => {
		const url = this.currentUrl()
		return url === '/manage-triads'
	})

	constructor() {
		// Track route changes
		this.routerSubscription = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
			if (event instanceof NavigationEnd) {
				this.currentUrl.set(event.urlAfterRedirects)
			}
		})
	}

	ngOnInit() {
		// Load difficulty from localStorage on component initialization
		this.selectedDifficulty.set(this.difficultyService.getDifficulty())
	}

	ngOnDestroy() {
		this.routerSubscription?.unsubscribe()
	}

	quitGame() {
		this.showQuitConfirmation.set(true)
	}

	confirmQuit() {
		this.store.resetGameState()
		this.router.navigate(['/home'])
		this.showQuitConfirmation.set(false)
	}

	cancelQuit() {
		this.showQuitConfirmation.set(false)
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

	toggleUsernameDropdown(event?: MouseEvent) {
		// Check if Ctrl (Windows/Linux) or Cmd (Mac) key is held
		const isModifierPressed = event ? event.ctrlKey || event.metaKey : false
		this.showAdminOption.set(isModifierPressed)
		const willOpen = !this.showUsernameDropdown()
		this.showUsernameDropdown.update((value) => !value)
		// Refresh difficulty from localStorage when opening the dropdown
		if (willOpen) {
			this.selectedDifficulty.set(this.difficultyService.getDifficulty())
		}
	}

	closeUsernameDropdown() {
		this.showUsernameDropdown.set(false)
		this.showAdminOption.set(false)
	}

	openStats() {
		this.showStats.set(true)
		this.closeUsernameDropdown()
	}

	openNewIdentity() {
		this.showNewIdentityDialog.set(true)
		this.closeUsernameDropdown()
	}

	closeNewIdentityDialog() {
		this.showNewIdentityDialog.set(false)
	}

	navigateToHome() {
		this.router.navigate(['/home'])
	}

	openAdminPasswordDialog() {
		if (this.adminAuthService.isAuthenticated()) {
			this.navigateToManageTriads()
		} else {
			this.showAdminPasswordDialog.set(true)
			this.closeUsernameDropdown()
		}
	}

	navigateToManageTriads() {
		this.router.navigate(['/manage-triads'])
		this.closeUsernameDropdown()
	}

	onAdminAuthenticated() {
		this.showAdminPasswordDialog.set(false)
		this.navigateToManageTriads()
	}

	closeAdminPasswordDialog() {
		this.showAdminPasswordDialog.set(false)
	}

	onDifficultyChange(difficulty: Difficulty) {
		this.selectedDifficulty.set(difficulty)
		this.difficultyService.setDifficulty(difficulty)
	}
}
