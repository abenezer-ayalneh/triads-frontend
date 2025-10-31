import { Component, input, signal } from '@angular/core'

import { ClickOutsideDirective } from '../../../../shared/directives/click-outside'
import { HighlightKeyPipe } from '../../../../shared/pipes/highlight-key.pipe'
import { SolvedTriad as SolvedTriadInterface } from '../../interfaces/triad.interface'

@Component({
	selector: 'app-solved-triad',
	imports: [HighlightKeyPipe, ClickOutsideDirective],
	templateUrl: './solved-triad.html',
	styleUrl: './solved-triad.scss',
})
export class SolvedTriad {
	solvedTriad = input.required<SolvedTriadInterface>()

	isTooltipVisible = signal<boolean>(false)

	showTooltip() {
		// Toggle tooltip visibility
		this.isTooltipVisible.update((currentValue) => !currentValue)
	}

	hideTooltip() {
		this.isTooltipVisible.set(false)
	}
}
