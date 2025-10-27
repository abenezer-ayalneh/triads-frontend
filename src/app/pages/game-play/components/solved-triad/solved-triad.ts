import { Component, input, signal } from '@angular/core'

import { SolvedTriad as SolvedTriadInterface } from '../../interfaces/triad.interface'

@Component({
	selector: 'app-solved-triad',
	imports: [],
	templateUrl: './solved-triad.html',
	styleUrl: './solved-triad.scss',
})
export class SolvedTriad {
	solvedTriad = input.required<SolvedTriadInterface>()

	showTooltip = signal<boolean>(false)

	onMouseEnter() {
		// Increase opacity on hover
	}

	onMouseLeave() {
		// Reset opacity on leave
	}

	onClick() {
		// Toggle tooltip visibility
		this.showTooltip.set(!this.showTooltip())
	}

	showFullPhrases() {
		// Show full phrases in tooltip
		return this.solvedTriad().fullPhrases
	}
}
