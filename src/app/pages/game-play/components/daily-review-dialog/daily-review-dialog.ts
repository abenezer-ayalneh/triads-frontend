import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'

import { Dialog } from '../../../../shared/components/dialog/dialog'
import { DailyReviewSummary } from '../../interfaces/daily-review.interface'

@Component({
	selector: 'app-daily-review-dialog',
	imports: [DatePipe, Dialog],
	templateUrl: './daily-review-dialog.html',
	styleUrl: './daily-review-dialog.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyReviewDialog {
	summary = input.required<DailyReviewSummary>()

	whenClosed = output<void>()

	onClose() {
		this.whenClosed.emit()
	}
}
