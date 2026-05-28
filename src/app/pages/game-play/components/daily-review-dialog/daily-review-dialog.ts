import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'

import { Dialog } from '../../../../shared/components/dialog/dialog'
import { HighlightKeyPipe } from '../../../../shared/pipes/highlight-key.pipe'
import { GAME_END_MESSAGES_CLASSIC, GAME_END_MESSAGES_REVIEW } from '../../constants/game-play.constant'
import { DailyReviewSummary } from '../../interfaces/daily-review.interface'

@Component({
	selector: 'app-daily-review-dialog',
	imports: [DatePipe, Dialog, HighlightKeyPipe],
	templateUrl: './daily-review-dialog.html',
	styleUrls: ['./daily-review-dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyReviewDialog {
	summary = input.required<DailyReviewSummary>()

	dialogTitle = input('Daily Review')

	useClassicHeadlines = input(false)

	whenClosed = output<void>()

	readonly resultHeadline = computed(() => {
		const score = this.summary().score
		const messages = this.useClassicHeadlines() ? GAME_END_MESSAGES_CLASSIC : GAME_END_MESSAGES_REVIEW
		const line = messages[score as keyof typeof messages]
		if (line !== undefined) {
			return line
		}
		return this.summary().result === 'WON' ? 'Solved' : 'Not solved'
	})

	onClose() {
		this.whenClosed.emit()
	}
}
