import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NavigationEnd, Router } from '@angular/router'
import { of, Subject } from 'rxjs'

import { AssetPreloadService } from '../../shared/services/asset-preload.service'
import { DailyPostPlayService } from '../../shared/services/daily-post-play.service'
import { DailyRolloverService } from '../../shared/services/daily-rollover.service'
import { SnackbarService } from '../../shared/services/snackbar.service'
import { DailyReviewSummary } from '../game-play/interfaces/daily-review.interface'
import { GamePlayApi } from '../game-play/services/game-play-api'
import { HomePage } from './home.page'

describe('HomePage', () => {
	let component: HomePage
	let fixture: ComponentFixture<HomePage>
	let routerEvents$: Subject<NavigationEnd>
	let dailyPostPlayService: jasmine.SpyObj<DailyPostPlayService>
	let reentryRollover: (() => void) | undefined

	const completedSummary: DailyReviewSummary = {
		result: 'LOST',
		score: 8,
		puzzleDate: '2026-04-20',
		nextPuzzleAt: '2026-04-21T05:00:00.000Z',
		triads: [{ id: 1, keyword: 'HAND', cues: ['SECOND', 'POKER', 'SHAKE'], fullPhrases: ['SECONDHAND', 'POKER HAND', 'HANDSHAKE'] }],
	}

	beforeEach(async () => {
		routerEvents$ = new Subject<NavigationEnd>()
		reentryRollover = undefined
		dailyPostPlayService = jasmine.createSpyObj<DailyPostPlayService>('DailyPostPlayService', ['loadCompletedDailySummary', 'shareScoreImage'])
		dailyPostPlayService.loadCompletedDailySummary.and.resolveTo(completedSummary)
		dailyPostPlayService.shareScoreImage.and.resolveTo()

		await TestBed.configureTestingModule({
			imports: [HomePage],
			providers: [
				{
					provide: GamePlayApi,
					useValue: {
						getDailyTodayInfo: () =>
							of({ scheduled: true, puzzleDate: '2026-04-20', triadGroupId: 42, challengeNumber: 1, hasCompletedDaily: true }),
					},
				},
				{
					provide: Router,
					useValue: {
						events: routerEvents$,
						navigate: jasmine.createSpy('navigate'),
					},
				},
				{
					provide: AssetPreloadService,
					useValue: {
						imageVersion: () => 0,
						getImageUrl: (path: string) => path,
					},
				},
				{
					provide: DailyPostPlayService,
					useValue: dailyPostPlayService,
				},
				{
					// Captures the re-entry handler so a test can simulate returning after a rollover.
					provide: DailyRolloverService,
					useValue: {
						easternCalendarLabel: () => ({ month: 'JUN', day: '16' }),
						startEasternDayWatcher: (handlers: { onReentryRollover?: () => void }) => {
							reentryRollover = handlers.onReentryRollover
							return jasmine.createSpy('stopEasternDayWatcher')
						},
					},
				},
				{
					provide: SnackbarService,
					useValue: jasmine.createSpyObj<SnackbarService>('SnackbarService', ['showSnackbar']),
				},
			],
		}).compileComponents()

		fixture = TestBed.createComponent(HomePage)
		component = fixture.componentInstance
		component.store.setUser({
			username: 'TestPlayer01',
			scores: { 15: 0, 12: 0, 10: 0, 8: 0, 6: 0, 3: 0, 0: 0 },
			firstGameDate: null,
		})
		fixture.detectChanges()
		await fixture.whenStable()
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})

	it('renders half-width share and review actions for completed daily players', () => {
		const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
		const shareButton = buttons.find((button) => button.getAttribute('aria-label') === 'Share daily result')
		const reviewButton = buttons.find((button) => button.getAttribute('aria-label') === 'Review daily result')
		const disabledDailyButton = buttons.find((button) => button.textContent?.includes('Daily Puzzle'))

		expect(shareButton).toBeTruthy()
		expect(reviewButton).toBeTruthy()
		expect(disabledDailyButton).toBeFalsy()
		expect(shareButton?.disabled).toBeFalse()
		expect(reviewButton?.disabled).toBeFalse()
		expect(shareButton?.classList.contains('flex-1')).toBeTrue()
		expect(reviewButton?.classList.contains('flex-1')).toBeTrue()
		expect(shareButton?.textContent).toContain('Share')
		expect(reviewButton?.textContent).toContain('Review')
	})

	it('opens the review dialog from the home page', async () => {
		await component.onReviewCompletedDaily()
		fixture.detectChanges()

		expect(component.reviewDialogOpen()).toBeTrue()
	})

	it('shares the completed daily result from the home page', async () => {
		await component.onShareCompletedDaily()

		expect(dailyPostPlayService.shareScoreImage).toHaveBeenCalledWith(8, '2026-04-20')
	})

	// ADR-0002: stale post-Daily popups must not linger over a refreshed home view after a rollover.
	it('dismisses open Play-More and Review popups on a rollover re-entry', () => {
		component.playMoreDialogOpen.set(true)
		component.reviewDialogOpen.set(true)

		reentryRollover?.()

		expect(component.playMoreDialogOpen()).toBeFalse()
		expect(component.reviewDialogOpen()).toBeFalse()
	})
})
