import { Component, computed, inject } from '@angular/core'

import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-solution-reveal',
	imports: [],
	templateUrl: './solution-reveal.html',
	styleUrl: './solution-reveal.scss',
})
export class SolutionReveal {
	readonly store = inject(GlobalStore)

	unsolvedTriads = computed(() => this.store.unsolvedTriads())

	hasUnsolvedTriads = computed(() => {
		const triads = this.unsolvedTriads()
		return triads !== null && triads.length > 0
	})
}
