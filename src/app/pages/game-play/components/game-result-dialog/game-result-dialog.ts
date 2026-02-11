import { Component, computed, effect, inject, input, output, signal } from '@angular/core'
import { Router } from '@angular/router'

import { SnackbarService } from '../../../../shared/services/snackbar.service'
import { GlobalStore } from '../../../../state/global.store'
import { getScoreGifFilename, getScoreGifPath, READY_TO_PLAY_LABEL, SCORE_SHARE_TITLE } from '../../constants/share.constant'
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
		const sharePayload = this.buildSharePayload()
		const scoreGifFile = await this.getScoreGifFile(sharePayload.scoreGifPath)

		const fileShareStatus = await this.shareViaFile(sharePayload, scoreGifFile)
		if (fileShareStatus === 'shared') {
			this.snackbarService.showSnackbar('Game result shared!', 3000)
			return
		}
		if (fileShareStatus === 'cancelled') {
			return
		}

		const textShareStatus = await this.shareViaText(sharePayload)
		if (textShareStatus === 'shared') {
			this.snackbarService.showSnackbar('Game result shared!', 3000)
			return
		}
		if (textShareStatus === 'cancelled') {
			return
		}

		const copiedToClipboard = await this.copyShareText(sharePayload.clipboardText)
		if (copiedToClipboard) {
			this.snackbarService.showSnackbar('Game result copied to clipboard!', 3000)
			return
		}

		this.snackbarService.showSnackbar('Failed to share game result. Please try again.', 5000)
	}

	private buildSharePayload() {
		const gameScore = this.store.gameScore()
		const appUrl = window.location.origin
		const scoreGifPath = getScoreGifPath(gameScore)

		const shareText = [`${READY_TO_PLAY_LABEL}`].join('\n')

		return {
			appUrl,
			scoreGifPath,
			shareText,
			clipboardText: shareText,
		}
	}

	private async getScoreGifFile(scoreGifPath: string): Promise<File | null> {
		try {
			const response = await fetch(scoreGifPath)
			if (!response.ok) {
				return null
			}

			const gifBlob = await response.blob()
			return new File([gifBlob], getScoreGifFilename(this.store.gameScore()), {
				type: 'image/gif',
			})
		} catch (error) {
			console.warn('Failed to fetch score GIF for sharing:', error)
			return null
		}
	}

	private async shareViaFile(
		sharePayload: { shareText: string; appUrl: string },
		scoreGifFile: File | null,
	): Promise<'shared' | 'cancelled' | 'failed' | 'unsupported'> {
		if (!scoreGifFile || typeof navigator.share !== 'function') {
			return 'unsupported'
		}

		if (typeof navigator.canShare !== 'function' || !navigator.canShare({ files: [scoreGifFile] })) {
			return 'unsupported'
		}

		try {
			await navigator.share({
				title: SCORE_SHARE_TITLE,
				text: sharePayload.shareText,
				url: sharePayload.appUrl,
				files: [scoreGifFile],
			})
			return 'shared'
		} catch (error) {
			if (this.isShareCancelled(error)) {
				return 'cancelled'
			}

			console.error('Failed to share game result with GIF:', error)
			return 'failed'
		}
	}

	private async shareViaText(sharePayload: { shareText: string; appUrl: string }): Promise<'shared' | 'cancelled' | 'failed' | 'unsupported'> {
		if (typeof navigator.share !== 'function') {
			return 'unsupported'
		}

		try {
			await navigator.share({
				title: SCORE_SHARE_TITLE,
				text: sharePayload.shareText,
				url: sharePayload.appUrl,
			})
			return 'shared'
		} catch (error) {
			if (this.isShareCancelled(error)) {
				return 'cancelled'
			}

			console.error('Failed to share game result as text:', error)
			return 'failed'
		}
	}

	private async copyShareText(shareText: string): Promise<boolean> {
		if (!navigator.clipboard?.writeText) {
			return false
		}

		try {
			await navigator.clipboard.writeText(shareText)
			return true
		} catch (error) {
			console.error('Failed to copy game result to clipboard:', error)
			return false
		}
	}

	private isShareCancelled(error: unknown): boolean {
		return error instanceof DOMException && error.name === 'AbortError'
	}
}
