import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NavigationEnd, Router } from '@angular/router'
import { of,Subject } from 'rxjs'

import { DailyReviewSummary } from '../../../pages/game-play/interfaces/daily-review.interface'
import { GamePlayApi } from '../../../pages/game-play/services/game-play-api'
import { AssetPreloadService } from '../../../shared/services/asset-preload.service'
import { DailyPostPlayService } from '../../../shared/services/daily-post-play.service'
import { SnackbarService } from '../../../shared/services/snackbar.service'
import { DailyLandingPage } from './daily-landing.page'

describe('DailyLandingPage', () => {
	let component: DailyLandingPage
	let fixture: ComponentFixture<DailyLandingPage>
	let routerEvents$: Subject<NavigationEnd>
	let dailyPostPlayService: jasmine.SpyObj<DailyPostPlayService>

	const completedSummary: DailyReviewSummary = {
		result: 'LOST',
		score: 8,
		nextPuzzleAt: '2026-04-21T05:00:00.000Z',
		triads: [{ id: 1, keyword: 'HAND', cues: ['SECOND', 'POKER', 'SHAKE'], fullPhrases: ['SECONDHAND', 'POKER HAND', 'HANDSHAKE'] }],
	}

	beforeEach(async () => {
		routerEvents$ = new Subject<NavigationEnd>()
		dailyPostPlayService = jasmine.createSpyObj<DailyPostPlayService>('DailyPostPlayService', ['loadCompletedDailySummary', 'shareScoreImage'])
		dailyPostPlayService.loadCompletedDailySummary.and.resolveTo(completedSummary)
		dailyPostPlayService.shareScoreImage.and.resolveTo()

		await TestBed.configureTestingModule({
			imports: [DailyLandingPage],
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
					provide: SnackbarService,
					useValue: jasmine.createSpyObj<SnackbarService>('SnackbarService', ['showSnackbar']),
				},
			],
		}).compileComponents()

		fixture = TestBed.createComponent(DailyLandingPage)
		component = fixture.componentInstance
		fixture.detectChanges()
		await fixture.whenStable()
		fixture.detectChanges()
	})

	it('renders share and review actions for completed daily players', () => {
		const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).map((button) =>
			button.textContent?.trim(),
		)

		expect(buttons).toContain('Share')
		expect(buttons).toContain('Review')
		expect(buttons).not.toContain('Come back tomorrow')
	})

	it('opens the review dialog from the landing page', async () => {
		await component.onReviewCompletedDaily()
		fixture.detectChanges()

		expect(component.reviewDialogOpen()).toBeTrue()
	})

	it('shares the completed daily result from the landing page', async () => {
		await component.onShareCompletedDaily()

		expect(dailyPostPlayService.shareScoreImage).toHaveBeenCalledWith(8)
	})
})
