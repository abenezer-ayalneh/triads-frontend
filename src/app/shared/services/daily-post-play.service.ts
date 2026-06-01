import { inject, Injectable } from '@angular/core'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { firstValueFrom } from 'rxjs'

import { getScorePngPath } from '../../pages/game-play/constants/share.constant'
import { DailyReviewSummary } from '../../pages/game-play/interfaces/daily-review.interface'
import { SolvedTriad } from '../../pages/game-play/interfaces/triad.interface'
import { GamePlayApi } from '../../pages/game-play/services/game-play-api'
import { SnackbarService } from './snackbar.service'

const REVIEW_TRIAD_COUNT = 4

const MONTH_ABBREVIATIONS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const

@Injectable({
	providedIn: 'root',
})
export class DailyPostPlayService {
	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly snackbarService = inject(SnackbarService)

	async shareScoreImage(score: number, puzzleDate: string | null) {
		if (!puzzleDate) {
			this.snackbarService.showSnackbar('Unable to share: puzzle date is unavailable.', 5000)
			return
		}

		const scorePngPath = getScorePngPath(score)

		if (Capacitor.isNativePlatform()) {
			const shared = await this.shareScoreImageNatively(scorePngPath, puzzleDate)
			if (!shared) {
				this.snackbarService.showSnackbar('Failed to share score image. Please try again.', 5000)
			}
			return
		}

		const copied = await this.copyScoreImageToClipboard(scorePngPath, puzzleDate)
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
			puzzleDate: response.puzzleDate,
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

	hasCompleteReviewTriads(triads: SolvedTriad[] | null | undefined): triads is SolvedTriad[] {
		return Array.isArray(triads) && triads.length === REVIEW_TRIAD_COUNT
	}

	mergeReviewTriads(solvedTriads: SolvedTriad[], unsolvedTriads: SolvedTriad[] | null) {
		return [...solvedTriads, ...(unsolvedTriads ?? [])].sort((left, right) => left.id - right.id)
	}

	private async shareScoreImageNatively(scorePngPath: string, puzzleDate: string): Promise<boolean> {
		try {
			const base64Png = await this.renderImageToBase64Png(scorePngPath, puzzleDate)

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

	private async copyScoreImageToClipboard(scorePngPath: string, puzzleDate: string): Promise<boolean> {
		if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
			return false
		}

		try {
			// Safari requires deferred blob via Promise; awaiting the blob before write drops transient user activation.
			await navigator.clipboard.write([
				new ClipboardItem({
					'image/png': this.renderImageToPngBlob(scorePngPath, puzzleDate),
				}),
			])
			return true
		} catch (error) {
			console.warn('Failed to copy score image to clipboard:', error)
			return false
		}
	}

	private async renderImageToPngBlob(src: string, puzzleDate: string): Promise<Blob> {
		const canvas = await this.renderImageToCanvas(src, puzzleDate)
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

	private async renderImageToBase64Png(src: string, puzzleDate: string): Promise<string> {
		const canvas = await this.renderImageToCanvas(src, puzzleDate)
		return canvas.toDataURL('image/png').split(',')[1] ?? ''
	}

	private renderImageToCanvas(src: string, puzzleDate: string): Promise<HTMLCanvasElement> {
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
				this.drawPuzzleDateBadge(ctx, canvas.width, puzzleDate)
				resolve(canvas)
			}

			img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
			img.src = src
		})
	}

	/**
	 * Draws the tear-off-calendar Puzzle-Date Badge in the top-right corner.
	 * Anchored to the puzzle's own date, sized proportionally to the image width.
	 */
	private drawPuzzleDateBadge(ctx: CanvasRenderingContext2D, imageWidth: number, puzzleDate: string): void {
		// Parse the ISO Y-M-D parts directly; new Date(str) would shift a day in negative-UTC zones.
		const [year, month, day] = puzzleDate.split('-').map(Number)
		if (!year || !month || !day) {
			return
		}

		const monthLabel = MONTH_ABBREVIATIONS[month - 1] ?? ''

		const badgeWidth = Math.round(imageWidth * 0.2)
		const badgeHeight = Math.round(badgeWidth * 1.15)
		const margin = Math.round(imageWidth * 0.04)
		const x = imageWidth - badgeWidth - margin
		const y = margin
		const radius = Math.round(badgeWidth * 0.1)
		const headerHeight = Math.round(badgeHeight * 0.3)

		ctx.save()

		// Soft drop shadow so the badge reads on any score background.
		ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
		ctx.shadowBlur = Math.round(badgeWidth * 0.08)
		ctx.shadowOffsetY = Math.round(badgeWidth * 0.03)

		// White body card.
		ctx.fillStyle = '#ffffff'
		this.roundedRectPath(ctx, x, y, badgeWidth, badgeHeight, radius)
		ctx.fill()

		// Clear shadow before drawing inner elements.
		ctx.shadowColor = 'transparent'
		ctx.shadowBlur = 0
		ctx.shadowOffsetY = 0

		// Gradient header strip (approximates the .triad-gradient radial fill).
		const gradient = ctx.createLinearGradient(x + badgeWidth, y, x, y + headerHeight)
		gradient.addColorStop(0, '#5adaff')
		gradient.addColorStop(1, '#5468ff')
		ctx.fillStyle = gradient
		ctx.save()
		this.roundedRectPath(ctx, x, y, badgeWidth, badgeHeight, radius)
		ctx.clip()
		ctx.fillRect(x, y, badgeWidth, headerHeight)
		ctx.restore()

		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'

		// Month label inside the header.
		ctx.fillStyle = '#ffffff'
		ctx.font = `700 ${Math.round(headerHeight * 0.5)}px sans-serif`
		ctx.fillText(monthLabel, x + badgeWidth / 2, y + headerHeight / 2)

		// Big day number.
		ctx.fillStyle = '#1f2937'
		ctx.font = `800 ${Math.round(badgeHeight * 0.4)}px sans-serif`
		ctx.fillText(String(day), x + badgeWidth / 2, y + headerHeight + (badgeHeight - headerHeight) * 0.42)

		// Year beneath the day.
		ctx.fillStyle = '#6b7280'
		ctx.font = `600 ${Math.round(badgeHeight * 0.13)}px sans-serif`
		ctx.fillText(String(year), x + badgeWidth / 2, y + headerHeight + (badgeHeight - headerHeight) * 0.82)

		ctx.restore()
	}

	private roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
		ctx.beginPath()
		ctx.moveTo(x + radius, y)
		ctx.arcTo(x + width, y, x + width, y + height, radius)
		ctx.arcTo(x + width, y + height, x, y + height, radius)
		ctx.arcTo(x, y + height, x, y, radius)
		ctx.arcTo(x, y, x + width, y, radius)
		ctx.closePath()
	}
}
