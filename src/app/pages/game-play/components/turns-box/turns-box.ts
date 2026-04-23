import { Component, computed, inject } from '@angular/core'

import { AssetPreloadService } from '../../../../shared/services/asset-preload.service'
import { GlobalStore } from '../../../../state/global.store'
import { TurnHintService } from '../../services/turn-hint.service'

const TURN_IMAGE_BY_AVAILABLE_COUNT: Record<1 | 2 | 3, string> = {
	3: 'images/turn-three.png',
	2: 'images/turn-two.png',
	1: 'images/turn-one.png',
}

@Component({
	selector: 'app-turns-box',
	templateUrl: './turns-box.html',
	styleUrl: './turns-box.scss',
})
export class TurnsBox {
	readonly store = inject(GlobalStore)

	private readonly assetPreloadService = inject(AssetPreloadService)

	private readonly turnHintService = inject(TurnHintService)

	readonly displayTurnIconUrl = computed(() => {
		this.assetPreloadService.imageVersion()
		const n = this.turnHintService.numberOfAvailableTurns(this.store.turns())
		if (n < 1 || n > 3) {
			return null
		}
		const path = TURN_IMAGE_BY_AVAILABLE_COUNT[n as 1 | 2 | 3]
		return this.assetPreloadService.getImageUrl(path)
	})

	readonly isLastTurnAndNoHints = computed(() => {
		const availableHints = this.store.hints().filter((hint) => hint.available).length
		return this.turnHintService.numberOfAvailableTurns(this.store.turns()) === 1 && availableHints === 0
	})
}
