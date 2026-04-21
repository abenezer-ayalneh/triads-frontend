import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core'
import { Router } from '@angular/router'
import { IonModal } from '@ionic/angular/standalone'

import { AssetPreloadService } from '../../../../shared/services/asset-preload.service'
import { DailyPostPlayService } from '../../../../shared/services/daily-post-play.service'
import { SnackbarService } from '../../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../../state/global.store'
import { getScoreGifPath } from '../../constants/share.constant'
import { DailyReviewSummary } from '../../interfaces/daily-review.interface'
import { DailyReviewDialog } from '../daily-review-dialog/daily-review-dialog'
import { SolutionReveal } from '../solution-reveal/solution-reveal'

const CELEBRATION_SOUND_PATH = 'sounds/ta-dah.mp3'

@Component({
	selector: 'app-game-result-dialog',
	imports: [DatePipe, DailyReviewDialog, IonModal, SolutionReveal],
	templateUrl: './game-result-dialog.html',
	styleUrl: './game-result-dialog.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameResultDialog {
	result = input.required<'WON' | 'LOST'>()

	restartRequested = output<void>()

	readonly store = inject(GlobalStore)

	private readonly router = inject(Router)

	private readonly assetPreloadService = inject(AssetPreloadService)

	private readonly dailyPostPlayService = inject(DailyPostPlayService)

	private readonly snackbarService = inject(SnackbarService)

	showPlayAgainButton = signal(false)

	readonly isDailyMode = computed(() => this.store.gameMode() === 'daily')

	countdownLabel = signal('')

	nextDailyPuzzleAvailable = signal(false)

	readonly scoreGifPath = computed(() => {
		this.assetPreloadService.imageVersion()
		return this.assetPreloadService.getImageUrl(getScoreGifPath(this.store.gameScore()))
	})

	readonly reviewDialogOpen = signal(false)

	readonly reviewLoading = signal(false)

	readonly reviewSummary = computed<DailyReviewSummary | null>(() => {
		if (!this.isDailyMode()) {
			return null
		}

		const result = this.result()
		const score = this.store.gameScore()
		const nextPuzzleAt = this.store.dailyNextPuzzleAt()
		const dailyReviewTriads = this.store.dailyReviewTriads()
		if (dailyReviewTriads && dailyReviewTriads.length > 0) {
			return this.dailyPostPlayService.createReviewSummary({
				result,
				score,
				nextPuzzleAt,
				triads: dailyReviewTriads,
			})
		}

		const currentGameTriads = this.dailyPostPlayService.mergeReviewTriads(this.store.solvedTriads(), this.store.unsolvedTriads())
		if (currentGameTriads.length === 0) {
			return null
		}

		return this.dailyPostPlayService.createReviewSummary({
			result,
			score,
			nextPuzzleAt,
			triads: currentGameTriads,
		})
	})

	constructor() {
		effect((onCleanup) => {
			const isDaily = this.store.gameMode() === 'daily'
			const target = this.store.dailyNextPuzzleAt()
			if (!isDaily || !target) {
				this.nextDailyPuzzleAvailable.set(false)
				this.countdownLabel.set('')
				return
			}
			const tick = () => {
				const diff = new Date(target).getTime() - Date.now()
				if (diff <= 0) {
					this.nextDailyPuzzleAvailable.set(true)
					this.countdownLabel.set('The next puzzle is available now.')
					return
				}
				this.nextDailyPuzzleAvailable.set(false)
				const h = Math.floor(diff / 3600000)
				const m = Math.floor((diff % 3600000) / 60000)
				const s = Math.floor((diff % 60000) / 1000)
				this.countdownLabel.set(`${h}h ${m}m ${s}s until the next daily puzzle (Eastern)`)
			}
			tick()
			const id = window.setInterval(tick, 1000)
			onCleanup(() => clearInterval(id))
		})

		// Watch for game state and unsolved triads to show button
		effect(() => {
			const result = this.result()
			const unsolvedTriads = this.store.unsolvedTriads()
			const gameScore = this.store.gameScore()

			if (this.store.gameMode() === 'daily') {
				this.showPlayAgainButton.set(true)
				return
			}

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
					this.assetPreloadService.playSound(CELEBRATION_SOUND_PATH, { volume: 0.7 })
				}
			}
		})
	}

	playNow() {
		this.restartGame()
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
		if (this.store.gameMode() === 'daily') {
			return
		}
		this.router.navigate(['/home'])
	}

	async shareGameResult() {
		await this.dailyPostPlayService.shareScoreImage(this.store.gameScore())
	}

	async openDailyReview() {
		const summary = this.reviewSummary()
		if (summary) {
			this.reviewDialogOpen.set(true)
			return
		}

		const triadGroupId = this.store.triadGroupId()
		if (!triadGroupId) {
			this.snackbarService.showSnackbar('Unable to load your daily review. Please try again.', 5000)
			return
		}

		this.reviewLoading.set(true)
		try {
			const triads = await this.dailyPostPlayService.loadReviewTriads(triadGroupId)
			this.store.setDailyReviewTriads(triads)
			this.reviewDialogOpen.set(true)
		} catch {
			this.snackbarService.showSnackbar('Unable to load your daily review. Please try again.', 5000)
		} finally {
			this.reviewLoading.set(false)
		}
	}

	closeDailyReview() {
		this.reviewDialogOpen.set(false)
	}
}
