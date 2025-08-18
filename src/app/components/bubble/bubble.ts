import { Component, computed, effect, ElementRef, inject, input } from '@angular/core'
import { AnimationOptions, LottieDirective } from 'ngx-lottie'

import { GamePlayState } from '../../pages/game-play/enums/game-play.enum'
import { Cue } from '../../pages/game-play/interfaces/cue.interface'
import { GlobalStore } from '../../state/global.store'

@Component({
	selector: 'app-bubble',
	imports: [LottieDirective],
	templateUrl: './bubble.html',
	styleUrl: './bubble.scss',
})
export class Bubble {
	readonly store = inject(GlobalStore)

	cue = input.required<Cue>()

	text = computed(() => this.cue().word)

	selected = computed<boolean>(() => this.store.selectedCues().some((cue) => cue.id === this.cue().id))

	pop = computed<boolean>(() => this.selected() && this.store.gamePlayState() === GamePlayState.CORRECT_ANSWER)

	// Expose host element so parent can position it
	element = inject<ElementRef<HTMLElement>>(ElementRef)

	bubblePopAnimationOptions: AnimationOptions = {
		path: 'lotties/pop-lottie.json',
		autoplay: true,
		loop: false,
	}

	popAudio = new Audio()

	constructor() {
		this.popAudio.src = 'sounds/pop.mp3'

		effect(() => {
			const isPopping = this.pop()
			if (isPopping) {
				this.popAudio.play()
			}
		})
	}

	whenClicked() {
		if (this.selected()) {
			this.store.removeSelectedCue(this.cue())
		} else if (this.store.selectedCues().length < 3) {
			this.store.addSelectedCue(this.cue())
		}
	}
}
