import { Component, computed, effect, inject, input, output, signal } from '@angular/core'
import { Router } from '@angular/router'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

import { SnackbarService } from '../../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../../state/global.store'
import { getScoreGifPath, getScorePngPath } from '../../constants/share.constant'
import { SolutionReveal } from '../solution-reveal/solution-reveal'

@Component({
	selector: 'app-game-result-dialog',
	imports: [SolutionReveal],
	templateUrl: './game-result-dialog.html',
	styleUrl: './game-result-dialog.scss',
})
export class GameResultDialog {
	result = input.required<'WON' | 'LOST'>()

	restartRequested = output<void>()

	readonly store = inject(GlobalStore)

	private readonly router = inject(Router)

	private readonly snackbarService = inject(SnackbarService)

	showPlayAgainButton = signal(false)

	readonly scorePngPath = computed(() => getScorePngPath(this.store.gameScore()))

	readonly scoreGifPath = computed(() => getScoreGifPath(this.store.gameScore()))

	private readonly taDahAudio = new Audio()

	constructor() {
		this.taDahAudio.src = 'sounds/ta-dah.mp3'
		this.taDahAudio.volume = 0.7

		// Watch for game state and unsolved triads to show button
		effect(() => {
			const result = this.result()
			const unsolvedTriads = this.store.unsolvedTriads()
			const gameScore = this.store.gameScore()

			if (result === 'LOST') {
				// For LOST state, show button after solutions appear (or after max 2 seconds)
				if (unsolvedTriads && unsolvedTriads.length > 0) {
					// Solutions are available, show button after short delay
					setTimeout(() => {
						this.showPlayAgainButton.set(true)
					}, 500)
				} else {
					// No solutions yet, show button after max 2 seconds
					setTimeout(() => {
						this.showPlayAgainButton.set(true)
					}, 2000)
				}
			} else if (result === 'WON') {
				// For WON state, show button immediately
				this.showPlayAgainButton.set(true)

				// Check if perfect score (15) - trigger celebration
				if (gameScore === 15) {
					// Play ta-dah sound effect
					this.taDahAudio.play().catch((error) => {
						// Silently fail if audio can't play (e.g., user interaction required)
						console.warn('Could not play celebration sound:', error)
					})
				}
			}
		})
	}

	restartGame() {
		this.store.setUnsolvedTriads(null)
		this.store.resetGameState()
		this.showPlayAgainButton.set(false)
		this.restartRequested.emit()
	}

	quitGame() {
		this.store.setUnsolvedTriads(null)
		this.store.resetGameState()
		this.showPlayAgainButton.set(false)
		this.router.navigate(['/home'])
	}

	async shareGameResult() {
		const scorePngPath = this.scorePngPath()

		if (Capacitor.isNativePlatform()) {
			const shared = await this.shareScoreImageNatively(scorePngPath)
			if (!shared) {
				this.snackbarService.showSnackbar('Failed to share score image. Please try again.', 5000)
			}
		} else {
			const copied = await this.copyScoreImageToClipboard(scorePngPath)
			if (copied) {
				this.snackbarService.showSnackbar('Score image copied to clipboard!', 3000)
			} else {
				this.snackbarService.showSnackbar('Failed to copy score image. Please try again.', 5000)
			}
		}
	}

	private async shareScoreImageNatively(scorePngPath: string): Promise<boolean> {
		try {
			const base64Png = await this.renderImageToBase64Png(scorePngPath)

			await Filesystem.writeFile({
				path: 'triads-score.png',
				data: base64Png,
				directory: Directory.Cache,
			})

			const { uri } = await Filesystem.getUri({
				path: 'triads-score.png',
				directory: Directory.Cache,
			})

			await Share.share({
				files: [uri],
				dialogTitle: 'Share your score',
			})

			return true
		} catch (error) {
			console.warn('Failed to share score image natively:', error)
			return false
		}
	}

	private async copyScoreImageToClipboard(scorePngPath: string): Promise<boolean> {
		if (!navigator.clipboard?.write) {
			return false
		}

		try {
			const pngBlob = await this.renderImageToPngBlob(scorePngPath)
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })])
			return true
		} catch (error) {
			console.warn('Failed to copy score image to clipboard:', error)
			return false
		}
	}

	private async renderImageToPngBlob(src: string): Promise<Blob> {
		const canvas = await this.renderImageToCanvas(src)
		return new Promise((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (blob) {
					resolve(blob)
				} else {
					reject(new Error('canvas.toBlob returned null'))
				}
			}, 'image/png')
		})
	}

	private async renderImageToBase64Png(src: string): Promise<string> {
		const canvas = await this.renderImageToCanvas(src)
		return canvas.toDataURL('image/png').split(',')[1]
	}

	private renderImageToCanvas(src: string): Promise<HTMLCanvasElement> {
		return new Promise((resolve, reject) => {
			const img = new Image()

			img.onload = () => {
				const canvas = document.createElement('canvas')
				canvas.width = img.naturalWidth
				canvas.height = img.naturalHeight
				const ctx = canvas.getContext('2d')

				if (!ctx) {
					reject(new Error('Could not get 2D context'))
					return
				}

				ctx.drawImage(img, 0, 0)
				resolve(canvas)
			}

			img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
			img.src = src
		})
	}
}
