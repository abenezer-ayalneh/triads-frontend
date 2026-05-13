import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { IonModal } from '@ionic/angular/standalone'
import { filter, skip, Subject, takeUntil } from 'rxjs'

import { DailyReviewDialog } from '../../../pages/game-play/components/daily-review-dialog/daily-review-dialog'
import { DailyReviewSummary } from '../../../pages/game-play/interfaces/daily-review.interface'
import { GamePlayApi } from '../../../pages/game-play/services/game-play-api'
import { UserInfoDialog } from '../../../pages/home/components/user-info-dialog/user-info-dialog'
import { BrainWarmingPlayButton } from '../../../shared/components/brain-warming-play-button/brain-warming-play-button'
import { AssetPreloadService } from '../../../shared/services/asset-preload.service'
import { DailyPostPlayService } from '../../../shared/services/daily-post-play.service'
import { DailyRolloverService } from '../../../shared/services/daily-rollover.service'
import { SnackbarService } from '../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../state/global.store'
import { DAILY_CHALLENGE_NUMBER_OFFSET, DAILY_LANDING_TAGLINE } from '../../constants/daily-landing.constants'

const TRIADS_LOGO_IMAGE_PATH = 'images/triads-logo-animated.svg'

@Component({
	selector: 'app-daily-landing',
	imports: [BrainWarmingPlayButton, DailyReviewDialog, IonModal, UserInfoDialog],
	templateUrl: './daily-landing.page.html',
	styleUrl: './daily-landing.page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyLandingPage implements OnInit, OnDestroy {
	readonly store = inject(GlobalStore)

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly router = inject(Router)

	private readonly assetPreloadService = inject(AssetPreloadService)

	private readonly dailyPostPlayService = inject(DailyPostPlayService)

	private readonly dailyRolloverService = inject(DailyRolloverService)

	private readonly snackbarService = inject(SnackbarService)

	private readonly destroy$ = new Subject<void>()

	private completedDailySummaryRequest: Promise<DailyReviewSummary | null> | null = null

	private stopEasternDayWatcher: (() => void) | null = null

	readonly playButton = viewChild(BrainWarmingPlayButton)

	readonly tagline = DAILY_LANDING_TAGLINE

	readonly challengeLine = signal<string | null>(null)

	readonly challengeLoading = signal(true)

	readonly logoUrl = computed(() => {
		this.assetPreloadService.imageVersion()
		return this.assetPreloadService.getImageUrl(TRIADS_LOGO_IMAGE_PATH)
	})

	readonly dailyScheduled = signal(true)

	readonly dailyCompleted = signal(false)

	readonly completedDailySummary = signal<DailyReviewSummary | null>(null)

	readonly completedDailySummaryLoading = signal(false)

	readonly reviewDialogOpen = signal(false)

	ngOnInit() {
		this.loadTodayInfo()
		this.stopEasternDayWatcher = this.dailyRolloverService.startEasternDayWatcher(() => this.loadTodayInfo())

		this.router.events
			.pipe(
				filter((e): e is NavigationEnd => e instanceof NavigationEnd),
				filter((e) => this.isDailyLandingPath(e.urlAfterRedirects)),
				skip(1),
				takeUntil(this.destroy$),
			)
			.subscribe(() => this.loadTodayInfo())
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
			this.snackbarService.showSnackbar('Unable to load your daily result. Please try again.', 5000)
			return
		}

		await this.dailyPostPlayService.shareScoreImage(summary.score)
	}

	async onReviewCompletedDaily() {
		const summary = await this.ensureCompletedDailySummaryLoaded()
		if (!summary) {
			this.snackbarService.showSnackbar('Unable to load your daily review. Please try again.', 5000)
			return
		}

		this.reviewDialogOpen.set(true)
	}

	closeReviewDialog() {
		this.reviewDialogOpen.set(false)
	}

	private isDailyLandingPath(url: string): boolean {
		const path = url.split('?')[0] ?? url
		return path === '/' || path === ''
	}

	private loadTodayInfo() {
		this.playButton()?.resetVisualState()
		this.challengeLoading.set(true)
		this.gamePlayApi.getDailyTodayInfo().subscribe({
			next: (res) => {
				this.challengeLoading.set(false)
				if (res.scheduled) {
					this.dailyScheduled.set(true)
					this.challengeLine.set(`Challenge #${DAILY_CHALLENGE_NUMBER_OFFSET + res.challengeNumber}`)
					this.dailyCompleted.set(res.hasCompletedDaily === true)
					if (res.hasCompletedDaily === true) {
						void this.ensureCompletedDailySummaryLoaded()
					} else {
						this.completedDailySummary.set(null)
					}
				} else {
					this.dailyScheduled.set(false)
					this.challengeLine.set(null)
					this.dailyCompleted.set(false)
					this.completedDailySummary.set(null)
				}
			},
			error: () => {
				this.challengeLoading.set(false)
				this.dailyScheduled.set(false)
				this.challengeLine.set(null)
				this.dailyCompleted.set(false)
				this.completedDailySummary.set(null)
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
			.catch(() => null)
			.finally(() => {
				this.completedDailySummaryLoading.set(false)
				this.completedDailySummaryRequest = null
			})

		return this.completedDailySummaryRequest
	}
}
