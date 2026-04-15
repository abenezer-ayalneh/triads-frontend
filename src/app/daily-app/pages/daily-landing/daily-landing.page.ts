import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { NavigationEnd, Router, RouterLink } from '@angular/router'
import { filter, skip, Subject, takeUntil } from 'rxjs'

import { GamePlayApi } from '../../../pages/game-play/services/game-play-api'
import { DAILY_CHALLENGE_NUMBER_OFFSET, DAILY_LANDING_ATTRIBUTION, DAILY_LANDING_TAGLINE } from '../../constants/daily-landing.constants'

@Component({
	selector: 'app-daily-landing',
	standalone: true,
	imports: [RouterLink],
	templateUrl: './daily-landing.page.html',
	styleUrl: './daily-landing.page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyLandingPage implements OnInit, OnDestroy {
	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly router = inject(Router)

	private readonly destroy$ = new Subject<void>()

	readonly tagline = DAILY_LANDING_TAGLINE

	readonly attribution = DAILY_LANDING_ATTRIBUTION

	readonly challengeLine = signal<string | null>(null)

	readonly challengeLoading = signal(true)

	readonly dailyCompleted = signal(false)

	ngOnInit() {
		this.loadTodayInfo()

		// IonRouterOutlet caches this page; returning from /play does not rerun ngOnInit.
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
		this.destroy$.next()
		this.destroy$.complete()
	}

	private isDailyLandingPath(url: string): boolean {
		const path = url.split('?')[0] ?? url
		return path === '/' || path === ''
	}

	private loadTodayInfo() {
		this.challengeLoading.set(true)
		this.gamePlayApi.getDailyTodayInfo().subscribe({
			next: (res) => {
				this.challengeLoading.set(false)
				if (res.scheduled) {
					this.challengeLine.set(`Challenge #${DAILY_CHALLENGE_NUMBER_OFFSET + res.triadGroupId}`)
					this.dailyCompleted.set(res.hasCompletedDaily === true)
				} else {
					this.challengeLine.set(null)
					this.dailyCompleted.set(false)
				}
			},
			error: () => {
				this.challengeLoading.set(false)
				this.challengeLine.set(null)
				this.dailyCompleted.set(false)
			},
		})
	}
}
