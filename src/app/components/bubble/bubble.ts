import { Component, computed, ElementRef, inject, input } from '@angular/core'
import { AnimationOptions, LottieDirective } from 'ngx-lottie'

import { GamePlayState } from '../../pages/game-play/enums/game-play.enum'
import { GlobalStore } from '../../state/global.store'

@Component({
	selector: 'app-bubble',
	imports: [LottieDirective],
	templateUrl: './bubble.html',
	styleUrl: './bubble.scss',
})
export class Bubble {
	readonly store = inject(GlobalStore)

	cue = input.required<string>()

	text = computed(() => this.cue())

	selected = computed<boolean>(() => this.store.selectedCues().some((cue) => cue === this.cue()))

	pop = computed<boolean>(() => this.store.cuesToExplode().includes(this.cue()))

	// Expose host element so parent can position it
	element = inject<ElementRef<HTMLElement>>(ElementRef)

	bubblePopAnimationOptions: AnimationOptions = {
		path: 'lotties/bubble-explosion.json',
		autoplay: true,
		loop: false,
	}

	whenClicked() {
		const selectedCuesLength = this.store.selectedCues().length
		if (this.selected()) {
			this.store.removeSelectedCue(this.cue())
			this.store.setGamePlayState(GamePlayState.PLAYING)
		} else if (selectedCuesLength < 3) {
			this.store.addSelectedCue(this.cue())
			if (selectedCuesLength === 2) {
				this.store.setGamePlayState(GamePlayState.CHECK_SOLUTION)
			}
		}
	}
}
