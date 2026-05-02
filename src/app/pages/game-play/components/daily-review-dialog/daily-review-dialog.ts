import { DatePipe } from '@angular/common'
import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	input,
	output,
	signal,
	viewChild,
} from '@angular/core'

import { Dialog } from '../../../../shared/components/dialog/dialog'
import { GAME_END_MESSAGES_REVIEW } from '../../constants/game-play.constant'
import { DailyReviewSummary } from '../../interfaces/daily-review.interface'

@Component({
	selector: 'app-daily-review-dialog',
	imports: [DatePipe, Dialog],
	templateUrl: './daily-review-dialog.html',
	styleUrls: ['./daily-review-dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyReviewDialog {
	summary = input.required<DailyReviewSummary>()

	whenClosed = output<void>()

	private readonly scrollHost = viewChild<ElementRef<HTMLElement>>('triadsScroll')

	private readonly destroyRef = inject(DestroyRef)

	readonly showScrollCue = signal(false)

	readonly resultHeadline = computed(() => {
		const score = this.summary().score
		const line = GAME_END_MESSAGES_REVIEW[score as keyof typeof GAME_END_MESSAGES_REVIEW]
		if (line !== undefined) {
			return line
		}
		return this.summary().result === 'WON' ? 'Solved' : 'Not solved'
	})

	constructor() {
		effect(() => {
			this.summary()
			queueMicrotask(() => this.updateScrollCue())
		})

		afterNextRender(() => {
			const onResize = () => this.updateScrollCue()
			window.addEventListener('resize', onResize, { passive: true })
			this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize))

			const attachObserver = () => {
				const el = this.scrollHost()?.nativeElement
				if (!el) {
					requestAnimationFrame(attachObserver)
					return
				}
				const ro = new ResizeObserver(() => this.updateScrollCue())
				ro.observe(el)
				this.destroyRef.onDestroy(() => ro.disconnect())
				this.updateScrollCue()
			}
			attachObserver()
		})
	}

	onTriadsScroll(): void {
		this.updateScrollCue()
	}

	onClose() {
		this.whenClosed.emit()
	}

	private updateScrollCue(): void {
		const el = this.scrollHost()?.nativeElement
		if (!el) {
			this.showScrollCue.set(false)
			return
		}
		const { scrollHeight, clientHeight, scrollTop } = el
		const hasOverflow = scrollHeight > clientHeight + 2
		const nearBottom = scrollTop + clientHeight >= scrollHeight - 12
		this.showScrollCue.set(hasOverflow && !nearBottom)
	}
}
