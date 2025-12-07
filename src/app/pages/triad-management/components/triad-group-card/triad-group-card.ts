import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'

import { HighlightKeyPipe } from '../../../../shared/pipes/highlight-key.pipe'
import { TriadGroup } from '../../interfaces/triad-group.interface'

@Component({
	selector: 'app-triad-group-card',
	standalone: true,
	imports: [HighlightKeyPipe],
	templateUrl: './triad-group-card.html',
	styleUrl: './triad-group-card.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriadGroupCard {
	triadGroup = input.required<TriadGroup>()

	editClicked = output<TriadGroup>()

	deleteClicked = output<number>()

	toggleStatusClicked = output<{ id: number; active: boolean }>()

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
