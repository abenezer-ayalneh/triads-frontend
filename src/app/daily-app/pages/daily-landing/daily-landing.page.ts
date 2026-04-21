import { DOCUMENT } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { IonModal } from '@ionic/angular/standalone'
import { filter, skip, Subject, takeUntil } from 'rxjs'

import { DailyReviewDialog } from '../../../pages/game-play/components/daily-review-dialog/daily-review-dialog'
import { DailyReviewSummary } from '../../../pages/game-play/interfaces/daily-review.interface'
import { GamePlayApi } from '../../../pages/game-play/services/game-play-api'
import { UserInfoDialog } from '../../../pages/home/components/user-info-dialog/user-info-dialog'
import { AssetPreloadService } from '../../../shared/services/asset-preload.service'
import { DailyPostPlayService } from '../../../shared/services/daily-post-play.service'
import { SnackbarService } from '../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../state/global.store'
import { DAILY_CHALLENGE_NUMBER_OFFSET, DAILY_LANDING_TAGLINE } from '../../constants/daily-landing.constants'

const LIGHT_GREY = '#01fac0'
const WHITE = '#ffffff'
const MID_GREY = '#fbeaea'
const HOT_RED = '#EF1A1A'
const BASE_FONT_PX = 20
const PREFIX_BIG_PX = 28
const HOT_BIG_PX = 52
const PULSE_MS = 1000
const CROSSFADE_MS = 600
const CROSSFADE_AT_MS = 3500
const PHASE2_START_MS = CROSSFADE_AT_MS + CROSSFADE_MS
const SHIMMER_AT_MS = PHASE2_START_MS + 2000
const EXPLODE_AT_MS = PHASE2_START_MS + 3500
const PLAY_HIDE_DELAY_MS = 300
const NAV_AFTER_EXPLODE_MS = 100
const TRIADS_LOGO_IMAGE_PATH = 'images/triads-logo-animated.svg'

const CONFETTI_COLORS = ['#EF1A1A', '#FF6B6B', '#FF4444', '#CC0000', '#FF8C00', '#FFD700', '#FF3300', '#FF0066', '#CC3300']

const LETTER_SHARD = ['h', 'o', 't', 'H', 'O', 'T', 'h', 'o', 't', 'H', 'O', 'T']

@Component({
	selector: 'app-daily-landing',
	imports: [DailyReviewDialog, IonModal, UserInfoDialog],
	templateUrl: './daily-landing.page.html',
	styleUrl: './daily-landing.page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyLandingPage implements OnInit, OnDestroy {
	readonly store = inject(GlobalStore)

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly router = inject(Router)

	private readonly document = inject(DOCUMENT)

	private readonly assetPreloadService = inject(AssetPreloadService)

	private readonly dailyPostPlayService = inject(DailyPostPlayService)

	private readonly snackbarService = inject(SnackbarService)

	private readonly destroy$ = new Subject<void>()

	private timers: ReturnType<typeof setTimeout>[] = []

	private completedDailySummaryRequest: Promise<DailyReviewSummary | null> | null = null

	readonly playLabel = viewChild<ElementRef<HTMLSpanElement>>('playLabel')

	readonly bt1 = viewChild<ElementRef<HTMLSpanElement>>('bt1')

	readonly bt2 = viewChild<ElementRef<HTMLSpanElement>>('bt2')

	readonly bHot = viewChild<ElementRef<HTMLSpanElement>>('bHot')

	readonly bPrefix = viewChild<ElementRef<HTMLSpanElement>>('bPrefix')

	readonly tagline = DAILY_LANDING_TAGLINE

	readonly challengeLine = signal<string | null>(null)

	readonly challengeLoading = signal(true)

	readonly logoUrl = computed(() => {
		this.assetPreloadService.imageVersion()
		return this.assetPreloadService.getImageUrl(TRIADS_LOGO_IMAGE_PATH)
	})

	readonly dailyScheduled = signal(true)

	readonly dailyCompleted = signal(false)

	readonly playAnimationRunning = signal(false)

	readonly completedDailySummary = signal<DailyReviewSummary | null>(null)

	readonly completedDailySummaryLoading = signal(false)

	readonly reviewDialogOpen = signal(false)

	ngOnInit() {
		this.loadTodayInfo()

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
		this.clearTimers()
		this.removeParticles()
		this.destroy$.next()
		this.destroy$.complete()
	}

	onPlayNow() {
		if (this.playAnimationRunning()) {
			return
		}
		const play = this.playLabel()?.nativeElement
		if (!play) {
			return
		}
		this.playAnimationRunning.set(true)

		play.style.opacity = '0'
		play.style.pointerEvents = 'none'
		this.clearTimers()
		this.removeParticles()

		this.after(PLAY_HIDE_DELAY_MS, () => this.startBrainWarmingSequence())

		const navigateAt = PLAY_HIDE_DELAY_MS + EXPLODE_AT_MS + NAV_AFTER_EXPLODE_MS
		this.after(navigateAt, () => {
			void this.router.navigate(['/play'])
		})
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
		this.resetPlayButtonVisualState()
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

	private clearTimers() {
		this.timers.forEach(clearTimeout)
		this.timers = []
	}

	private after(ms: number, fn: () => void) {
		this.timers.push(setTimeout(fn, ms))
	}

	private setColor(el: HTMLElement, color: string, durationMs: number) {
		el.style.transition = `color ${durationMs}ms ease`
		el.style.color = color
	}

	private startBrainWarmingSequence() {
		const bt1 = this.bt1()?.nativeElement
		const bt2 = this.bt2()?.nativeElement
		const bHot = this.bHot()?.nativeElement
		const bPrefix = this.bPrefix()?.nativeElement
		if (!bt1 || !bt2 || !bHot || !bPrefix) {
			return
		}

		bt1.style.transition = 'none'
		bt1.style.color = LIGHT_GREY
		bt1.style.opacity = '0'
		bt2.style.transition = 'none'
		bt2.style.opacity = '0'
		bHot.style.transition = 'none'
		bHot.style.color = MID_GREY
		bHot.style.fontSize = `${BASE_FONT_PX}px`
		bPrefix.style.transition = 'none'
		bPrefix.style.color = MID_GREY
		bPrefix.style.fontSize = `${BASE_FONT_PX}px`
		bHot.classList.remove('daily-play-hot--shimmer')

		this.after(50, () => {
			bt1.style.transition = 'opacity 400ms ease'
			bt1.style.opacity = '1'
		})

		this.after(0, () => this.setColor(bt1, LIGHT_GREY, 100))
		this.after(PULSE_MS, () => this.setColor(bt1, WHITE, 700))
		this.after(PULSE_MS * 2, () => this.setColor(bt1, LIGHT_GREY, 700))
		this.after(PULSE_MS * 3, () => this.setColor(bt1, WHITE, 700))

		this.after(CROSSFADE_AT_MS, () => {
			bt1.style.transition = `opacity ${CROSSFADE_MS}ms ease`
			bt1.style.opacity = '0'
			bHot.style.transition = 'none'
			bHot.style.color = MID_GREY
			bHot.style.fontSize = `${BASE_FONT_PX}px`
			bPrefix.style.transition = 'none'
			bPrefix.style.color = MID_GREY
			bPrefix.style.fontSize = `${BASE_FONT_PX}px`
			bt2.style.transition = `opacity ${CROSSFADE_MS}ms ease`
			bt2.style.opacity = '1'
		})

		this.after(PHASE2_START_MS, () => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					bHot.style.transition = 'font-size 3.5s cubic-bezier(0.4, 0, 0.2, 1), color 3.5s ease'
					bHot.style.fontSize = `${HOT_BIG_PX}px`
					bHot.style.color = HOT_RED
					bPrefix.style.transition = 'font-size 3.5s cubic-bezier(0.4, 0, 0.2, 1)'
					bPrefix.style.fontSize = `${PREFIX_BIG_PX}px`
				})
			})
		})

		this.after(SHIMMER_AT_MS, () => {
			bHot.classList.add('daily-play-hot--shimmer')
		})

		this.after(EXPLODE_AT_MS, () => {
			bHot.classList.remove('daily-play-hot--shimmer')
			this.explodeHot(bHot, bt2)
		})
	}

	private explodeHot(bHot: HTMLElement, bt2: HTMLElement) {
		const rect = bHot.getBoundingClientRect()
		bt2.style.opacity = '0'

		const body = this.document.body

		for (let i = 0; i < 60; i++) {
			const idx = i
			const sp = this.document.createElement('div')
			sp.setAttribute('data-daily-play-particle', '1')
			const isLetter = idx < 12
			let w: number

			if (isLetter) {
				sp.style.fontFamily = 'inherit'
				sp.style.fontWeight = '600'
				const fs = Math.round(HOT_BIG_PX * (0.4 + Math.random() * 0.5))
				sp.style.fontSize = `${fs}px`
				sp.style.color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? HOT_RED
				sp.style.lineHeight = '1'
				sp.textContent = LETTER_SHARD[idx] ?? 'h'
				w = fs * 0.7
			} else {
				w = 6 + Math.random() * 14
				const h2 = 6 + Math.random() * 14
				sp.style.width = `${w}px`
				sp.style.height = `${h2}px`
				sp.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? HOT_RED
				sp.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
			}

			const sx = rect.left + Math.random() * rect.width - w / 2
			const sy = rect.top + Math.random() * rect.height - w / 2
			sp.style.position = 'fixed'
			sp.style.left = `${sx}px`
			sp.style.top = `${sy}px`
			sp.style.opacity = '1'
			sp.style.pointerEvents = 'none'
			sp.style.zIndex = '9999'
			body.appendChild(sp)

			const angle = Math.random() * Math.PI * 2
			const speed = 120 + Math.random() * 260
			const dx = Math.cos(angle) * speed
			const dy = Math.sin(angle) * speed - (40 + Math.random() * 80)
			const rot = (Math.random() - 0.5) * 720
			const dur = 600 + Math.random() * 700
			const delay = Math.random() * 120

			setTimeout(() => {
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						sp.style.transition = `transform ${dur}ms cubic-bezier(0.1, 0.2, 0.6, 1), opacity ${dur * 0.5}ms ease ${dur * 0.45}ms`
						sp.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(0.3)`
						sp.style.opacity = '0'
					})
				})
				setTimeout(() => {
					sp.remove()
				}, dur + 300)
			}, delay)
		}
	}

	private removeParticles() {
		this.document.querySelectorAll('[data-daily-play-particle="1"]').forEach((p) => p.remove())
	}

	private resetPlayButtonVisualState() {
		this.clearTimers()
		this.removeParticles()
		this.playAnimationRunning.set(false)

		const play = this.playLabel()?.nativeElement
		if (play) {
			play.style.opacity = '1'
			play.style.pointerEvents = ''
		}

		const bt1 = this.bt1()?.nativeElement
		if (bt1) {
			bt1.style.transition = 'none'
			bt1.style.opacity = '0'
			bt1.style.color = '#bbbbbb'
		}

		const bt2 = this.bt2()?.nativeElement
		if (bt2) {
			bt2.style.transition = 'none'
			bt2.style.opacity = '0'
		}

		const bHot = this.bHot()?.nativeElement
		if (bHot) {
			bHot.style.transition = 'none'
			bHot.style.color = MID_GREY
			bHot.style.fontSize = `${BASE_FONT_PX}px`
			bHot.classList.remove('daily-play-hot--shimmer')
		}

		const bPrefix = this.bPrefix()?.nativeElement
		if (bPrefix) {
			bPrefix.style.transition = 'none'
			bPrefix.style.color = MID_GREY
			bPrefix.style.fontSize = `${BASE_FONT_PX}px`
		}
	}
}
