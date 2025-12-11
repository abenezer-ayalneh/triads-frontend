import { Component, computed, inject } from '@angular/core'

import { HighlightKeyPipe } from '../../../../shared/pipes/highlight-key.pipe'
import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-solution-reveal',
	imports: [HighlightKeyPipe],
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
