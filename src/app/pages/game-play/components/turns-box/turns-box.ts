import { NgClass } from '@angular/common'
import { Component, computed, inject } from '@angular/core'

import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-turns-box',
	imports: [NgClass],
	templateUrl: './turns-box.html',
	styleUrl: './turns-box.scss',
})
export class TurnsBox {
	readonly store = inject(GlobalStore)

	readonly isLastTurnAndNoHints = computed(() => {
		const turns = this.store.turns()
		const hints = this.store.hints()

		const availableTurns = turns.filter((turn) => turn.available).length
		const availableHints = hints.filter((hint) => hint.available).length

		return availableTurns === 1 && availableHints === 0
	})

	readonly lastAvailableTurnId = computed(() => {
		const turns = this.store.turns()
		const availableTurns = turns.filter((turn) => turn.available)

		if (availableTurns.length === 0) {
			return null
		}

		return availableTurns[availableTurns.length - 1]!.id
	})
}
