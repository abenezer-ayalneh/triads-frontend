import { inject,Injectable } from '@angular/core'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { firstValueFrom } from 'rxjs'

import { getScorePngPath } from '../../pages/game-play/constants/share.constant'
import { DailyReviewSummary } from '../../pages/game-play/interfaces/daily-review.interface'
import { SolvedTriad } from '../../pages/game-play/interfaces/triad.interface'
import { GamePlayApi } from '../../pages/game-play/services/game-play-api'
import { SnackbarService } from './snackbar.service'

@Injectable({
	providedIn: 'root',
})
export class DailyPostPlayService {
	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly snackbarService = inject(SnackbarService)

	async shareScoreImage(score: number) {
		const scorePngPath = getScorePngPath(score)

		if (Capacitor.isNativePlatform()) {
			const shared = await this.shareScoreImageNatively(scorePngPath)
			if (!shared) {
				this.snackbarService.showSnackbar('Failed to share score image. Please try again.', 5000)
			}
			return
		}

		const copied = await this.copyScoreImageToClipboard(scorePngPath)
		if (copied) {
			this.snackbarService.showSnackbar('Score image copied to clipboard!', 3000)
			return
		}

		this.snackbarService.showSnackbar('Failed to copy score image. Please try again.', 5000)
	}

	async loadCompletedDailySummary(): Promise<DailyReviewSummary> {
		const response = await firstValueFrom(this.gamePlayApi.getDailyCues())
		if (!response.scheduled || !response.alreadyCompleted) {
			throw new Error('Completed daily summary is unavailable')
		}

		const triads = await this.loadReviewTriads(response.triadGroupId)
		return this.createReviewSummary({
			result: response.attemptStatus,
			score: response.score ?? 0,
			nextPuzzleAt: response.nextPuzzleAt,
			triads,
		})
	}

	async loadReviewTriads(triadGroupId: string | number) {
		return firstValueFrom(this.gamePlayApi.getTriadGroupSolutions(triadGroupId))
	}

	createReviewSummary(summary: DailyReviewSummary): DailyReviewSummary {
		return {
			...summary,
			triads: this.mergeReviewTriads(summary.triads, null),
		}
	}

	mergeReviewTriads(solvedTriads: SolvedTriad[], unsolvedTriads: SolvedTriad[] | null) {
		return [...solvedTriads, ...(unsolvedTriads ?? [])].sort((left, right) => left.id - right.id)
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
		return canvas.toDataURL('image/png').split(',')[1] ?? ''
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
