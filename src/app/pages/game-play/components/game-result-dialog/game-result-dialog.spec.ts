import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'

import { SnackbarService } from '../../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../../state/global.store'
import { getScoreGifPath, getScorePngPath } from '../../constants/share.constant'
import { GameResultDialog } from './game-result-dialog'

interface GameResultDialogPrivateApi {
	copyScoreImageToClipboard: (scorePngPath: string) => Promise<boolean>
	renderImageToPngBlob: (src: string) => Promise<Blob>
}

describe('GameResultDialog', () => {
	let component: GameResultDialog
	let fixture: ComponentFixture<GameResultDialog>
	let snackbarService: jasmine.SpyObj<SnackbarService>
	let mockStore: {
		unsolvedTriads: jasmine.Spy
		gameScore: jasmine.Spy
		solvedTriads: jasmine.Spy
		triadsStep: jasmine.Spy
		turns: jasmine.Spy
		setUnsolvedTriads: jasmine.Spy
		resetGameState: jasmine.Spy
	}

	beforeEach(async () => {
		snackbarService = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['showSnackbar'])
		mockStore = {
			unsolvedTriads: jasmine.createSpy('unsolvedTriads').and.returnValue(null),
			gameScore: jasmine.createSpy('gameScore').and.returnValue(10),
			solvedTriads: jasmine.createSpy('solvedTriads').and.returnValue([{}, {}]),
			triadsStep: jasmine.createSpy('triadsStep').and.returnValue('INITIAL'),
			turns: jasmine.createSpy('turns').and.returnValue([{ available: true }, { available: false }, { available: false }]),
			setUnsolvedTriads: jasmine.createSpy('setUnsolvedTriads'),
			resetGameState: jasmine.createSpy('resetGameState'),
		}

		await TestBed.configureTestingModule({
			imports: [GameResultDialog],
			providers: [
				{
					provide: GlobalStore,
					useValue: mockStore,
				},
				{
					provide: SnackbarService,
					useValue: snackbarService,
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

	it('copies score PNG image to clipboard when share is clicked', async () => {
		const privateApi = component as unknown as GameResultDialogPrivateApi
		spyOn(privateApi, 'copyScoreImageToClipboard').and.resolveTo(true)

		await component.shareGameResult()

		expect(privateApi.copyScoreImageToClipboard).toHaveBeenCalledWith(getScorePngPath(10))
		expect(snackbarService.showSnackbar).toHaveBeenCalledWith('Score image copied to clipboard!', 3000)
	})

	it('shows failure snackbar when clipboard copy fails', async () => {
		const privateApi = component as unknown as GameResultDialogPrivateApi
		spyOn(privateApi, 'copyScoreImageToClipboard').and.resolveTo(false)

		await component.shareGameResult()

		expect(snackbarService.showSnackbar).toHaveBeenCalledWith('Failed to copy score image. Please try again.', 5000)
	})

	it('copies PNG image to clipboard via canvas and navigator.clipboard.write', async () => {
		const privateApi = component as unknown as GameResultDialogPrivateApi
		const pngBlob = new Blob([], { type: 'image/png' })
		spyOn(privateApi, 'renderImageToPngBlob').and.resolveTo(pngBlob)
		const clipboardWriteSpy = spyOn(navigator.clipboard, 'write').and.resolveTo()

		const result = await privateApi.copyScoreImageToClipboard('/images/score-pngs/score-10.png')

		expect(privateApi.renderImageToPngBlob).toHaveBeenCalledWith('/images/score-pngs/score-10.png')
		expect(clipboardWriteSpy).toHaveBeenCalled()
		expect(result).toBe(true)
	})

	it('returns false when image rendering fails', async () => {
		const privateApi = component as unknown as GameResultDialogPrivateApi
		spyOn(privateApi, 'renderImageToPngBlob').and.rejectWith(new Error('load failed'))

		const result = await privateApi.copyScoreImageToClipboard('/images/score-pngs/score-10.png')

		expect(result).toBe(false)
	})

	it('returns false when navigator.clipboard.write is not available', async () => {
		const privateApi = component as unknown as GameResultDialogPrivateApi
		const originalClipboard = navigator.clipboard
		;(navigator as { clipboard?: Clipboard }).clipboard = undefined

		const result = await privateApi.copyScoreImageToClipboard('/images/score-pngs/score-10.png')

		;(navigator as { clipboard?: Clipboard }).clipboard = originalClipboard
		expect(result).toBe(false)
	})
})
