import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NavigationEnd, Router } from '@angular/router'
import { IonModal } from '@ionic/angular/standalone'
import { filter, skip, Subject, takeUntil } from 'rxjs'

import { BrainWarmingPlayButton } from '../../shared/components/brain-warming-play-button/brain-warming-play-button'
import { isApiError, parseApiError } from '../../shared/errors/api-error.util'
import { AssetPreloadService } from '../../shared/services/asset-preload.service'
import { DailyPostPlayService } from '../../shared/services/daily-post-play.service'
import { DailyRolloverService } from '../../shared/services/daily-rollover.service'
import { GlobalStore } from '../../state/global.store'
import { DailyReviewDialog } from '../game-play/components/daily-review-dialog/daily-review-dialog'
import { DailyReviewSummary } from '../game-play/interfaces/daily-review.interface'
import { GamePlayApi } from '../game-play/services/game-play-api'
import { UserInfoDialog } from './components/user-info-dialog/user-info-dialog'

const TRIADS_LOGO_IMAGE_PATH = 'images/triads-logo-animated.svg'

@Component({
	selector: 'app-home',
	imports: [FormsModule, UserInfoDialog, BrainWarmingPlayButton, DailyReviewDialog, IonModal],
	templateUrl: './home.page.html',
	styleUrl: './home.page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit, OnDestroy {
	readonly store = inject(GlobalStore)

	private readonly router = inject(Router)

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly assetPreloadService = inject(AssetPreloadService)

	private readonly dailyPostPlayService = inject(DailyPostPlayService)

	private readonly dailyRolloverService = inject(DailyRolloverService)

	private readonly destroy$ = new Subject<void>()

	private completedDailySummaryRequest: Promise<DailyReviewSummary | null> | null = null

	private stopEasternDayWatcher: (() => void) | null = null

	readonly dailyPlayButton = viewChild<BrainWarmingPlayButton>('dailyPlayButton')

	readonly classicPlayButton = viewChild<BrainWarmingPlayButton>('classicPlayButton')

	readonly logoUrl = computed(() => {
		this.assetPreloadService.imageVersion()
		return this.assetPreloadService.getImageUrl(TRIADS_LOGO_IMAGE_PATH)
	})

	readonly dailyInfoLoading = signal(true)

	readonly dailyScheduled = signal(false)

	readonly dailyCompleted = signal(false)

	readonly completedDailySummary = signal<DailyReviewSummary | null>(null)

	readonly completedDailySummaryLoading = signal(false)

	readonly reviewDialogOpen = signal(false)

	readonly loadErrorMessage = signal<string | null>(null)

	readonly easternCalendarLabel = signal(this.dailyRolloverService.easternCalendarLabel())

	ngOnInit() {
		this.loadTodayInfo()

		this.stopEasternDayWatcher = this.dailyRolloverService.startEasternDayWatcher(() => {
			this.easternCalendarLabel.set(this.dailyRolloverService.easternCalendarLabel())
			this.loadTodayInfo()
		})

		this.router.events
			.pipe(
				filter((e): e is NavigationEnd => e instanceof NavigationEnd),
				filter((e) => this.isHomePath(e.urlAfterRedirects)),
				skip(1),
				takeUntil(this.destroy$),
			)
			.subscribe(() => {
				this.dailyPlayButton()?.resetVisualState()
				this.classicPlayButton()?.resetVisualState()
				this.loadTodayInfo()
			})
	}

	ngOnDestroy() {
		this.stopEasternDayWatcher?.()
		this.stopEasternDayWatcher = null
		this.destroy$.next()
		this.destroy$.complete()
	}

	async onShareCompletedDaily() {
		const summary = await this.ensureCompletedDailySummaryLoaded()
		if (!summary) {
			return
		}

		await this.dailyPostPlayService.shareScoreImage(summary.score)
	}

	async onReviewCompletedDaily() {
		const summary = await this.ensureCompletedDailySummaryLoaded()
		if (!summary) {
			return
		}

		this.reviewDialogOpen.set(true)
	}

	closeReviewDialog() {
		this.reviewDialogOpen.set(false)
	}

	private isHomePath(url: string): boolean {
		const path = url.split('?')[0] ?? url
		return path === '/' || path === ''
	}

	private loadTodayInfo() {
		this.dailyInfoLoading.set(true)
		this.loadErrorMessage.set(null)
		this.gamePlayApi.getDailyTodayInfo().subscribe({
			next: (res) => {
				this.dailyInfoLoading.set(false)
				if (res.scheduled) {
					this.dailyScheduled.set(true)
					this.dailyCompleted.set(res.hasCompletedDaily === true)
					if (res.hasCompletedDaily === true) {
						void this.ensureCompletedDailySummaryLoaded()
					} else {
						this.completedDailySummary.set(null)
					}
				} else {
					this.dailyScheduled.set(false)
					this.dailyCompleted.set(false)
					this.completedDailySummary.set(null)
				}
			},
			error: (error) => {
				const apiError = isApiError(error) ? error : parseApiError(error)
				apiError.markHandled()
				this.dailyInfoLoading.set(false)
				this.dailyScheduled.set(false)
				this.dailyCompleted.set(false)
				this.completedDailySummary.set(null)
				this.loadErrorMessage.set(apiError.userMessage)
			},
		})
	}

	private async ensureCompletedDailySummaryLoaded(): Promise<DailyReviewSummary | null> {
		const existingSummary = this.completedDailySummary()
		if (existingSummary) {
			return existingSummary
		}

		if (this.completedDailySummaryRequest) {
			return this.completedDailySummaryRequest
		}

		this.completedDailySummaryLoading.set(true)
		this.completedDailySummaryRequest = this.dailyPostPlayService
			.loadCompletedDailySummary()
			.then((summary) => {
				this.completedDailySummary.set(summary)
				return summary
			})
			.catch((error) => {
				const apiError = isApiError(error) ? error : parseApiError(error)
				apiError.markHandled()
				this.loadErrorMessage.set(apiError.userMessage)
				return null
			})
			.finally(() => {
				this.completedDailySummaryLoading.set(false)
				this.completedDailySummaryRequest = null
			})

		return this.completedDailySummaryRequest
	}
}
