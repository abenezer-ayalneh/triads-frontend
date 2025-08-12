import { Component, input } from '@angular/core'

import { Cue } from '../../pages/game-play/interfaces/cue.interface'
import { Bubble } from '../bubble/bubble'

@Component({
	selector: 'app-bubble-container',
	imports: [Bubble],
	templateUrl: './bubble-container.html',
	styleUrl: './bubble-container.scss',
})
export class BubbleContainer {
	cues = input.required<Cue[]>()
}
