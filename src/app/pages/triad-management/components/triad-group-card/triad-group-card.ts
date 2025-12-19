import { NgClass } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'

import { Difficulty } from '../../../../shared/enums/difficulty.enum'
import { HighlightKeyPipe } from '../../../../shared/pipes/highlight-key.pipe'
import { TriadGroup } from '../../interfaces/triad-group.interface'

@Component({
	selector: 'app-triad-group-card',
	standalone: true,
	imports: [HighlightKeyPipe, NgClass],
	templateUrl: './triad-group-card.html',
	styleUrl: './triad-group-card.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriadGroupCard {
	triadGroup = input.required<TriadGroup>()

	editClicked = output<TriadGroup>()

	deleteClicked = output<number>()

	toggleStatusClicked = output<{ id: number; active: boolean }>()

	readonly Difficulty = Difficulty

	getDifficultyBackgroundClass(): string {
		const group = this.triadGroup()
		if (!group.active) {
			return 'bg-neutral-400'
		}

		const difficulty = group.difficulty.toUpperCase()
		switch (difficulty) {
			case Difficulty.EASY:
				return 'bg-green-100'
			case Difficulty.MEDIUM:
				return 'bg-orange-100'
			case Difficulty.HARD:
				return 'bg-red-100'
			default:
				return 'bg-neutral-100'
		}
	}

	getDifficultyText(): string {
		return this.triadGroup().difficulty
	}

	getDifficultyBadgeColor(): string {
		const group = this.triadGroup()
		if (!group.active) {
			return 'bg-gray-500'
		}

		const difficulty = group.difficulty.toUpperCase()
		switch (difficulty) {
			case Difficulty.EASY:
				return 'bg-green-500'
			case Difficulty.MEDIUM:
				return 'bg-orange-500'
			case Difficulty.HARD:
				return 'bg-red-500'
			default:
				return 'bg-gray-500'
		}
	}

	onEdit() {
		this.editClicked.emit(this.triadGroup())
	}

	onDelete() {
		this.deleteClicked.emit(this.triadGroup().id)
	}

	onToggleStatus() {
		const currentStatus = this.triadGroup().active
		this.toggleStatusClicked.emit({ id: this.triadGroup().id, active: !currentStatus })
	}
}
