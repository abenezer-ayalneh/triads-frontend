import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'

import { AssetPreloadService } from '../../../../shared/services/asset-preload.service'
import { DailyPostPlayService } from '../../../../shared/services/daily-post-play.service'
import { SnackbarService } from '../../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../../state/global.store'
import { getScoreGifPath } from '../../constants/share.constant'
import { GameResultDialog } from './game-result-dialog'

describe('GameResultDialog', () => {
	let component: GameResultDialog
	let fixture: ComponentFixture<GameResultDialog>
	let mockStore: {
		gameMode: jasmine.Spy
		unsolvedTriads: jasmine.Spy
		gameScore: jasmine.Spy
		solvedTriads: jasmine.Spy
		dailyNextPuzzleAt: jasmine.Spy
		dailyReviewTriads: jasmine.Spy
		triadGroupId: jasmine.Spy
		setDailyReviewTriads: jasmine.Spy
		setUnsolvedTriads: jasmine.Spy
		resetGameState: jasmine.Spy
	}
	let dailyPostPlayService: jasmine.SpyObj<DailyPostPlayService>

	beforeEach(async () => {
		mockStore = {
			gameMode: jasmine.createSpy('gameMode').and.returnValue('daily'),
			unsolvedTriads: jasmine.createSpy('unsolvedTriads').and.returnValue(null),
			gameScore: jasmine.createSpy('gameScore').and.returnValue(10),
			solvedTriads: jasmine.createSpy('solvedTriads').and.returnValue([]),
			dailyNextPuzzleAt: jasmine.createSpy('dailyNextPuzzleAt').and.returnValue('2026-04-21T05:00:00.000Z'),
			dailyReviewTriads: jasmine
				.createSpy('dailyReviewTriads')
				.and.returnValue([{ id: 1, keyword: 'HAND', cues: ['SECOND', 'POKER', 'SHAKE'], fullPhrases: ['SECONDHAND', 'POKER HAND', 'HANDSHAKE'] }]),
			triadGroupId: jasmine.createSpy('triadGroupId').and.returnValue(42),
			setDailyReviewTriads: jasmine.createSpy('setDailyReviewTriads'),
			setUnsolvedTriads: jasmine.createSpy('setUnsolvedTriads'),
			resetGameState: jasmine.createSpy('resetGameState'),
		}
		dailyPostPlayService = jasmine.createSpyObj<DailyPostPlayService>('DailyPostPlayService', [
			'shareScoreImage',
			'createReviewSummary',
			'mergeReviewTriads',
			'loadReviewTriads',
		])
		dailyPostPlayService.createReviewSummary.and.callFake((summary) => summary)
		dailyPostPlayService.mergeReviewTriads.and.callFake((solvedTriads, unsolvedTriads) => [...solvedTriads, ...(unsolvedTriads ?? [])])
		dailyPostPlayService.shareScoreImage.and.resolveTo()
		dailyPostPlayService.loadReviewTriads.and.resolveTo([
			{ id: 1, keyword: 'HAND', cues: ['SECOND', 'POKER', 'SHAKE'], fullPhrases: ['SECONDHAND', 'POKER HAND', 'HANDSHAKE'] },
		])

		await TestBed.configureTestingModule({
			imports: [GameResultDialog],
			providers: [
				{
					provide: GlobalStore,
					useValue: mockStore,
				},
				{
					provide: DailyPostPlayService,
					useValue: dailyPostPlayService,
				},
				{
					provide: AssetPreloadService,
					useValue: {
						imageVersion: () => 0,
						getImageUrl: (path: string) => path,
						playSound: jasmine.createSpy('playSound'),
					},
				},
				{
					provide: SnackbarService,
					useValue: jasmine.createSpyObj<SnackbarService>('SnackbarService', ['showSnackbar']),
				},
				{
					provide: Router,
					useValue: jasmine.createSpyObj<Router>('Router', ['navigate']),
				},
			],
		}).compileComponents()

		fixture = TestBed.createComponent(GameResultDialog)
		component = fixture.componentInstance
		fixture.componentRef.setInput('result', 'WON')
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})

	it('renders score-specific GIF in result dialog', () => {
		const renderedImage = fixture.nativeElement.querySelector('img')

		expect(renderedImage).toBeTruthy()
		expect(renderedImage.getAttribute('src')).toBe(getScoreGifPath(10))
		expect(renderedImage.getAttribute('alt')).toContain('score 10')
	})

	it('shares the current score through the shared post-play service', async () => {
		await component.shareGameResult()

		expect(dailyPostPlayService.shareScoreImage).toHaveBeenCalledWith(10)
	})

	it('renders daily share and review actions', () => {
		const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).map((button) =>
			button.textContent?.trim(),
		)

		expect(buttons).toContain('Share')
		expect(buttons).toContain('Review')
	})

	it('opens the review dialog immediately when daily review data is already available', async () => {
		await component.openDailyReview()

		expect(component.reviewDialogOpen()).toBeTrue()
		expect(dailyPostPlayService.loadReviewTriads).not.toHaveBeenCalled()
	})

	it('loads review data before opening when daily triads are not cached yet', async () => {
		mockStore.dailyReviewTriads.and.returnValue(null)
		mockStore.solvedTriads.and.returnValue([])
		mockStore.unsolvedTriads.and.returnValue(null)
		fixture = TestBed.createComponent(GameResultDialog)
		component = fixture.componentInstance
		fixture.componentRef.setInput('result', 'WON')
		fixture.detectChanges()

		await component.openDailyReview()

		expect(dailyPostPlayService.loadReviewTriads).toHaveBeenCalledWith(42)
		expect(mockStore.setDailyReviewTriads).toHaveBeenCalled()
		expect(component.reviewDialogOpen()).toBeTrue()
	})
})
