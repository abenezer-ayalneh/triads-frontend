import { Component, computed, inject, OnDestroy, OnInit, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NavigationEnd, Router } from '@angular/router'
import { filter, skip, Subject, takeUntil } from 'rxjs'

import { BrainWarmingPlayButton } from '../../shared/components/brain-warming-play-button/brain-warming-play-button'
import { AssetPreloadService } from '../../shared/services/asset-preload.service'
import { GlobalStore } from '../../state/global.store'
import { UserInfoDialog } from './components/user-info-dialog/user-info-dialog'

const TRIADS_LOGO_IMAGE_PATH = 'images/triads-logo-animated.svg'

@Component({
	selector: 'app-home',
	imports: [FormsModule, UserInfoDialog, BrainWarmingPlayButton],
	templateUrl: './home.page.html',
	styleUrl: './home.page.scss',
})
export class HomePage implements OnInit, OnDestroy {
	readonly store = inject(GlobalStore)

	private readonly router = inject(Router)

	private readonly assetPreloadService = inject(AssetPreloadService)

	private readonly destroy$ = new Subject<void>()

	readonly playButton = viewChild(BrainWarmingPlayButton)

	readonly logoUrl = computed(() => {
		this.assetPreloadService.imageVersion()
		return this.assetPreloadService.getImageUrl(TRIADS_LOGO_IMAGE_PATH)
	})

	ngOnInit() {
		this.router.events
			.pipe(
				filter((e): e is NavigationEnd => e instanceof NavigationEnd),
				filter((e) => this.isClassicHomePath(e.urlAfterRedirects)),
				skip(1),
				takeUntil(this.destroy$),
			)
			.subscribe(() => {
				this.playButton()?.resetVisualState()
			})
	}

	ngOnDestroy() {
		this.destroy$.next()
		this.destroy$.complete()
	}

	private isClassicHomePath(url: string): boolean {
		const path = url.split('?')[0] ?? url
		return path === '/home'
	}
}
