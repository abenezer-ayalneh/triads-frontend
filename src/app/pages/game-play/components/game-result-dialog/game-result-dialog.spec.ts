import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

import { SnackbarService } from '../../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../../state/global.store'
import { getScoreGifPath, getScorePngPath } from '../../constants/share.constant'
import { GameResultDialog } from './game-result-dialog'

interface GameResultDialogPrivateApi {
	shareScoreImageNatively: (scorePngPath: string) => Promise<boolean>
	copyScoreImageToClipboard: (scorePngPath: string) => Promise<boolean>
	renderImageToPngBlob: (src: string) => Promise<Blob>
	renderImageToBase64Png: (src: string) => Promise<string>
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

	describe('on web', () => {
		beforeEach(() => {
			spyOn(Capacitor, 'isNativePlatform').and.returnValue(false)
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
	})

	describe('on native', () => {
		beforeEach(() => {
			spyOn(Capacitor, 'isNativePlatform').and.returnValue(true)
		})

		it('opens native share sheet when share is clicked', async () => {
			const privateApi = component as unknown as GameResultDialogPrivateApi
			spyOn(privateApi, 'shareScoreImageNatively').and.resolveTo(true)

			await component.shareGameResult()

			expect(privateApi.shareScoreImageNatively).toHaveBeenCalledWith(getScorePngPath(10))
			expect(snackbarService.showSnackbar).not.toHaveBeenCalled()
		})

		it('shows failure snackbar when native share fails', async () => {
			const privateApi = component as unknown as GameResultDialogPrivateApi
			spyOn(privateApi, 'shareScoreImageNatively').and.resolveTo(false)

			await component.shareGameResult()

			expect(snackbarService.showSnackbar).toHaveBeenCalledWith('Failed to share score image. Please try again.', 5000)
		})

		it('writes PNG to cache and opens share sheet via Capacitor plugins', async () => {
			const privateApi = component as unknown as GameResultDialogPrivateApi
			const base64Data = 'aGVsbG8='
			spyOn(privateApi, 'renderImageToBase64Png').and.resolveTo(base64Data)
			spyOn(Filesystem, 'writeFile').and.resolveTo({ uri: '' })
			spyOn(Filesystem, 'getUri').and.resolveTo({ uri: 'file:///cache/triads-score.png' })
			spyOn(Share, 'share').and.resolveTo({ activityType: '' })

			const result = await privateApi.shareScoreImageNatively('/images/score-pngs/score-10.png')

			expect(privateApi.renderImageToBase64Png).toHaveBeenCalledWith('/images/score-pngs/score-10.png')
			expect(Filesystem.writeFile).toHaveBeenCalledWith(
				jasmine.objectContaining({ path: 'triads-score.png', data: base64Data, directory: Directory.Cache }),
			)
			expect(Share.share).toHaveBeenCalledWith(jasmine.objectContaining({ files: ['file:///cache/triads-score.png'] }))
			expect(result).toBe(true)
		})

		it('returns false when native share throws', async () => {
			const privateApi = component as unknown as GameResultDialogPrivateApi
			spyOn(privateApi, 'renderImageToBase64Png').and.rejectWith(new Error('load failed'))

			const result = await privateApi.shareScoreImageNatively('/images/score-pngs/score-10.png')

			expect(result).toBe(false)
		})
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
