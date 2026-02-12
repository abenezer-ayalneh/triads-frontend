import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

import { SnackbarService } from '../../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../../state/global.store'
import { getScoreGifPath } from '../../constants/share.constant'
import { GameResultDialog } from './game-result-dialog'

type ShareStatus = 'shared' | 'cancelled' | 'failed' | 'unsupported'

interface SharePayload {
	appUrl: string
	scoreGifPath: string
	shareText: string
	clipboardText: string
}

interface ShareComponentPrivateApi {
	buildSharePayload: () => SharePayload
	isNativePlatform: () => boolean
	shareViaNative: (sharePayload: SharePayload) => Promise<ShareStatus>
	getScoreGifFile: (scoreGifPath: string) => Promise<File | null>
	getNativeScoreGifUri: (scoreGifPath: string) => Promise<string | null>
	blobToBase64: (blob: Blob) => Promise<string>
	shareViaFile: (sharePayload: SharePayload, scoreGifFile: File | null) => Promise<ShareStatus>
	shareViaText: (sharePayload: SharePayload) => Promise<ShareStatus>
	copyShareText: (shareText: string) => Promise<boolean>
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
		const renderedGif = fixture.nativeElement.querySelector('img')

		expect(renderedGif).toBeTruthy()
		expect(renderedGif.getAttribute('src')).toBe(getScoreGifPath(10))
		expect(renderedGif.getAttribute('alt')).toContain('score 10')
	})

	it('shares with GIF file first when file sharing is supported', async () => {
		const sharePayload = {
			appUrl: 'https://triads.app',
			scoreGifPath: '/images/score-gifs/score-10.gif',
			shareText: 'share text',
			clipboardText: 'share text',
		}
		const privateApi = component as unknown as ShareComponentPrivateApi
		const scoreGifFile = new File(['gif-content'], 'score-10.gif', { type: 'image/gif' })
		const buildSharePayloadSpy = spyOn(privateApi, 'buildSharePayload').and.returnValue(sharePayload)
		const isNativePlatformSpy = spyOn(privateApi, 'isNativePlatform').and.returnValue(false)
		const shareViaNativeSpy = spyOn(privateApi, 'shareViaNative').and.resolveTo('unsupported')
		const getScoreGifFileSpy = spyOn(privateApi, 'getScoreGifFile').and.resolveTo(scoreGifFile)
		const shareViaFileSpy = spyOn(privateApi, 'shareViaFile').and.resolveTo('shared')
		const shareViaTextSpy = spyOn(privateApi, 'shareViaText').and.resolveTo('unsupported')
		const copyShareTextSpy = spyOn(privateApi, 'copyShareText').and.resolveTo(false)

		await component.shareGameResult()

		expect(buildSharePayloadSpy).toHaveBeenCalled()
		expect(isNativePlatformSpy).toHaveBeenCalled()
		expect(shareViaNativeSpy).not.toHaveBeenCalled()
		expect(getScoreGifFileSpy).toHaveBeenCalledWith('/images/score-gifs/score-10.gif')
		expect(shareViaFileSpy).toHaveBeenCalledWith(sharePayload, scoreGifFile)
		expect(shareViaTextSpy).not.toHaveBeenCalled()
		expect(copyShareTextSpy).not.toHaveBeenCalled()
		expect(snackbarService.showSnackbar).toHaveBeenCalledWith('Game result shared!', 3000)
	})

	it('falls back to text sharing when file sharing is unavailable', async () => {
		const sharePayload = {
			appUrl: 'https://triads.app',
			scoreGifPath: '/images/score-gifs/score-10.gif',
			shareText: 'share text',
			clipboardText: 'share text',
		}
		const privateApi = component as unknown as ShareComponentPrivateApi
		const buildSharePayloadSpy = spyOn(privateApi, 'buildSharePayload').and.returnValue(sharePayload)
		const isNativePlatformSpy = spyOn(privateApi, 'isNativePlatform').and.returnValue(false)
		const shareViaNativeSpy = spyOn(privateApi, 'shareViaNative').and.resolveTo('unsupported')
		const getScoreGifFileSpy = spyOn(privateApi, 'getScoreGifFile').and.resolveTo(null)
		const shareViaFileSpy = spyOn(privateApi, 'shareViaFile').and.resolveTo('unsupported')
		const shareViaTextSpy = spyOn(privateApi, 'shareViaText').and.resolveTo('shared')
		const copyShareTextSpy = spyOn(privateApi, 'copyShareText').and.resolveTo(false)

		await component.shareGameResult()

		expect(buildSharePayloadSpy).toHaveBeenCalled()
		expect(isNativePlatformSpy).toHaveBeenCalled()
		expect(shareViaNativeSpy).not.toHaveBeenCalled()
		expect(getScoreGifFileSpy).toHaveBeenCalledWith('/images/score-gifs/score-10.gif')
		expect(shareViaFileSpy).toHaveBeenCalledWith(sharePayload, null)
		expect(shareViaTextSpy).toHaveBeenCalledWith(sharePayload)
		expect(copyShareTextSpy).not.toHaveBeenCalled()
		expect(snackbarService.showSnackbar).toHaveBeenCalledWith('Game result shared!', 3000)
	})

	it('falls back to clipboard when sharing is unavailable and includes ready-to-play url in payload', async () => {
		const privateApi = component as unknown as ShareComponentPrivateApi
		spyOn(privateApi, 'isNativePlatform').and.returnValue(false)
		spyOn(privateApi, 'shareViaNative').and.resolveTo('unsupported')
		const shareViaFileSpy = spyOn(privateApi, 'shareViaFile').and.resolveTo('unsupported')
		const shareViaTextSpy = spyOn(privateApi, 'shareViaText').and.resolveTo('unsupported')
		const copyShareTextSpy = spyOn(privateApi, 'copyShareText').and.resolveTo(true)

		await component.shareGameResult()

		const buildSharePayload = privateApi.buildSharePayload()
		expect(buildSharePayload.shareText).toContain('Ready to play?')
		expect(buildSharePayload.shareText).toContain(window.location.origin)
		expect(shareViaFileSpy).toHaveBeenCalled()
		expect(shareViaTextSpy).toHaveBeenCalled()
		expect(copyShareTextSpy).toHaveBeenCalledWith(buildSharePayload.clipboardText)
		expect(snackbarService.showSnackbar).toHaveBeenCalledWith('Game result copied to clipboard!', 3000)
	})

	it('uses native sharing path in Capacitor and skips web share methods', async () => {
		const sharePayload = {
			appUrl: 'https://triads.app',
			scoreGifPath: '/images/score-gifs/score-10.gif',
			shareText: 'share text',
			clipboardText: 'share text',
		}
		const privateApi = component as unknown as ShareComponentPrivateApi
		spyOn(privateApi, 'buildSharePayload').and.returnValue(sharePayload)
		spyOn(privateApi, 'isNativePlatform').and.returnValue(true)
		const shareViaNativeSpy = spyOn(privateApi, 'shareViaNative').and.resolveTo('shared')
		const getScoreGifFileSpy = spyOn(privateApi, 'getScoreGifFile').and.resolveTo(null)
		const shareViaFileSpy = spyOn(privateApi, 'shareViaFile').and.resolveTo('unsupported')
		const shareViaTextSpy = spyOn(privateApi, 'shareViaText').and.resolveTo('unsupported')
		const copyShareTextSpy = spyOn(privateApi, 'copyShareText').and.resolveTo(false)

		await component.shareGameResult()

		expect(shareViaNativeSpy).toHaveBeenCalledWith(sharePayload)
		expect(getScoreGifFileSpy).not.toHaveBeenCalled()
		expect(shareViaFileSpy).not.toHaveBeenCalled()
		expect(shareViaTextSpy).not.toHaveBeenCalled()
		expect(copyShareTextSpy).not.toHaveBeenCalled()
		expect(snackbarService.showSnackbar).toHaveBeenCalledWith('Game result shared!', 3000)
	})

	it('returns silently when native share is cancelled', async () => {
		const sharePayload = {
			appUrl: 'https://triads.app',
			scoreGifPath: '/images/score-gifs/score-10.gif',
			shareText: 'share text',
			clipboardText: 'share text',
		}
		const privateApi = component as unknown as ShareComponentPrivateApi
		spyOn(privateApi, 'buildSharePayload').and.returnValue(sharePayload)
		spyOn(privateApi, 'isNativePlatform').and.returnValue(true)
		spyOn(privateApi, 'shareViaNative').and.resolveTo('cancelled')
		const copyShareTextSpy = spyOn(privateApi, 'copyShareText').and.resolveTo(true)

		await component.shareGameResult()

		expect(copyShareTextSpy).not.toHaveBeenCalled()
		expect(snackbarService.showSnackbar).not.toHaveBeenCalled()
	})

	it('falls back to clipboard when native sharing fails', async () => {
		const sharePayload = {
			appUrl: 'https://triads.app',
			scoreGifPath: '/images/score-gifs/score-10.gif',
			shareText: 'share text',
			clipboardText: 'share text',
		}
		const privateApi = component as unknown as ShareComponentPrivateApi
		spyOn(privateApi, 'buildSharePayload').and.returnValue(sharePayload)
		spyOn(privateApi, 'isNativePlatform').and.returnValue(true)
		spyOn(privateApi, 'shareViaNative').and.resolveTo('failed')
		const copyShareTextSpy = spyOn(privateApi, 'copyShareText').and.resolveTo(true)

		await component.shareGameResult()

		expect(copyShareTextSpy).toHaveBeenCalledWith('share text')
		expect(snackbarService.showSnackbar).toHaveBeenCalledWith('Game result copied to clipboard!', 3000)
	})

	it('falls back to native text share when native GIF URI is unavailable', async () => {
		const privateApi = component as unknown as ShareComponentPrivateApi
		spyOn(privateApi, 'getNativeScoreGifUri').and.resolveTo(null)
		const shareSpy = spyOn(Share, 'share').and.resolveTo({ activityType: '' } as Awaited<ReturnType<typeof Share.share>>)

		const shareStatus = await privateApi.shareViaNative({
			appUrl: 'https://triads.app',
			scoreGifPath: '/images/score-gifs/score-10.gif',
			shareText: 'share text',
			clipboardText: 'share text',
		})

		expect(shareSpy).toHaveBeenCalledTimes(1)
		expect(shareSpy).toHaveBeenCalledWith(
			jasmine.objectContaining({
				text: 'share text',
				url: 'https://triads.app',
			}),
		)
		expect(shareStatus).toBe('shared')
	})

	it('returns failed when native GIF share and text share both fail', async () => {
		const privateApi = component as unknown as ShareComponentPrivateApi
		spyOn(privateApi, 'getNativeScoreGifUri').and.resolveTo('file://cache/score-10.gif')
		spyOn(Share, 'share').and.rejectWith(new Error('share failed'))

		const shareStatus = await privateApi.shareViaNative({
			appUrl: 'https://triads.app',
			scoreGifPath: '/images/score-gifs/score-10.gif',
			shareText: 'share text',
			clipboardText: 'share text',
		})

		expect(shareStatus).toBe('failed')
	})

	it('writes GIF to cache and returns URI for native sharing', async () => {
		const privateApi = component as unknown as ShareComponentPrivateApi
		const fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response(new Blob(['gif-content'], { type: 'image/gif' }), { status: 200 }))
		const writeFileSpy = spyOn(Filesystem, 'writeFile').and.resolveTo({ uri: 'file://cache/score-10.gif' })
		const getUriSpy = spyOn(Filesystem, 'getUri').and.resolveTo({ uri: 'file://cache/score-10.gif' })

		const scoreGifUri = await privateApi.getNativeScoreGifUri('/images/score-gifs/score-10.gif')

		expect(fetchSpy).toHaveBeenCalledWith('/images/score-gifs/score-10.gif')
		expect(writeFileSpy).toHaveBeenCalledWith(
			jasmine.objectContaining({
				path: jasmine.stringMatching(/share\/\d+-score-10\.gif$/),
				directory: Directory.Cache,
			}),
		)
		expect(getUriSpy).toHaveBeenCalledWith(
			jasmine.objectContaining({
				path: jasmine.stringMatching(/share\/\d+-score-10\.gif$/),
				directory: Directory.Cache,
			}),
		)
		expect(scoreGifUri).toBe('file://cache/score-10.gif')
	})

	it('returns null when native GIF preparation fails', async () => {
		const privateApi = component as unknown as ShareComponentPrivateApi
		spyOn(window, 'fetch').and.resolveTo(new Response(new Blob(['gif-content'], { type: 'image/gif' }), { status: 200 }))
		spyOn(Filesystem, 'writeFile').and.rejectWith(new Error('write failed'))
		const getUriSpy = spyOn(Filesystem, 'getUri').and.resolveTo({ uri: 'file://cache/score-10.gif' })

		const scoreGifUri = await privateApi.getNativeScoreGifUri('/images/score-gifs/score-10.gif')

		expect(getUriSpy).not.toHaveBeenCalled()
		expect(scoreGifUri).toBeNull()
	})
})
