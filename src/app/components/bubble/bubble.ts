import { Component, computed, inject, input, output } from '@angular/core'

import { Cue } from '../../pages/game-play/interfaces/cue.interface'
import { GlobalStore } from '../../state/global.store'

@Component({
	selector: 'app-bubble',
	imports: [],
	templateUrl: './bubble.html',
	styleUrl: './bubble.scss',
})
export class Bubble {
	cue = input.required<Cue>()

	readonly store = inject(GlobalStore)

	text = computed(() => this.cue().word)

	selected = computed<boolean>(() => this.store.selectedCues().some((cue) => cue.id === this.cue().id))

	whenClickedOutput = output<Cue>()

	whenClicked() {
		this.whenClickedOutput.emit(this.cue())
	}
}
