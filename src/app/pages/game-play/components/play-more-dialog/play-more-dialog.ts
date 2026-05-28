import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'

import { Dialog } from '../../../../shared/components/dialog/dialog'
import {
	DAILY_CLASSIC_EXTRA_LIMIT,
	PLAY_MORE_DIALOG_DIFFICULTY_HINT,
	PLAY_MORE_DIALOG_HEADER_HINT,
	PLAY_MORE_DIALOG_TITLE,
} from '../../../../shared/constants/global.constant'
import { Difficulty } from '../../../../shared/enums/difficulty.enum'
import { DifficultyService } from '../../../../shared/services/difficulty.service'
import { PlayRouteIntentService } from '../../../../shared/services/play-route-intent.service'
import { navigateToClassicFromPlayMore } from '../../../../shared/utils/navigate-to-classic.util'
import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-play-more-dialog',
	imports: [Dialog, FormsModule],
	templateUrl: './play-more-dialog.html',
	styleUrl: './play-more-dialog.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayMoreDialog {
	remaining = input.required<number>()

	whenClosed = output<void>()

	readonly dialogTitle = PLAY_MORE_DIALOG_TITLE

	readonly difficultyHint = PLAY_MORE_DIALOG_DIFFICULTY_HINT

	readonly headerHint = PLAY_MORE_DIALOG_HEADER_HINT

	readonly selectedDifficulty = signal<Difficulty>(Difficulty.MEDIUM)

	readonly canPlay = computed(() => this.remaining() > 0)

	readonly gamesPlayed = computed(() => DAILY_CLASSIC_EXTRA_LIMIT - this.remaining())

	readonly playedDots = computed(() => {
		const played = this.gamesPlayed()
		return Array.from({ length: DAILY_CLASSIC_EXTRA_LIMIT }, (_, index) => index < played)
	})

	readonly progressLabel = computed(() => `${this.gamesPlayed()}/${DAILY_CLASSIC_EXTRA_LIMIT}`)

	protected readonly Difficulty = Difficulty

	protected readonly DAILY_CLASSIC_EXTRA_LIMIT = DAILY_CLASSIC_EXTRA_LIMIT

	private readonly difficultyService = inject(DifficultyService)

	private readonly store = inject(GlobalStore)

	private readonly playRouteIntent = inject(PlayRouteIntentService)

	private readonly router = inject(Router)

	constructor() {
		this.selectedDifficulty.set(this.difficultyService.getDifficulty())
	}

	onDifficultyChange(difficulty: Difficulty) {
		this.selectedDifficulty.set(difficulty)
	}

	onPlayNow() {
		if (!this.canPlay()) {
			return
		}

		navigateToClassicFromPlayMore(this.selectedDifficulty(), {
			difficultyService: this.difficultyService,
			store: this.store,
			playRouteIntent: this.playRouteIntent,
			router: this.router,
		})
		this.whenClosed.emit()
	}

	onClose() {
		this.whenClosed.emit()
	}
}
