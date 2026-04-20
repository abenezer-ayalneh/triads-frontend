import { Component, computed, inject, input, signal } from '@angular/core'

import { ClickOutsideDirective } from '../../../../shared/directives/click-outside'
import { HighlightKeyPipe } from '../../../../shared/pipes/highlight-key.pipe'
import { AssetPreloadService } from '../../../../shared/services/asset-preload.service'
import { SolvedTriad as SolvedTriadInterface } from '../../interfaces/triad.interface'

const BUBBLE_IMAGE_PATH = 'images/bubble.png'

@Component({
	selector: 'app-solved-triad',
	imports: [HighlightKeyPipe, ClickOutsideDirective],
	templateUrl: './solved-triad.html',
	styleUrl: './solved-triad.scss',
})
export class SolvedTriad {
	private readonly assetPreloadService = inject(AssetPreloadService)

	solvedTriad = input.required<SolvedTriadInterface>()

	isTooltipVisible = signal<boolean>(false)

	readonly bubbleBackgroundImage = computed(() => {
		this.assetPreloadService.imageVersion()
		return `url("${this.assetPreloadService.getImageUrl(BUBBLE_IMAGE_PATH)}")`
	})

	showTooltip() {
		// Toggle tooltip visibility
		this.isTooltipVisible.update((currentValue) => !currentValue)
	}

	hideTooltip() {
		this.isTooltipVisible.set(false)
	}
}
