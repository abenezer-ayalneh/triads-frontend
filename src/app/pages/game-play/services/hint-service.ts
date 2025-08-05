import { inject, Injectable } from '@angular/core'

import { Bubble } from '../../bubbles/interfaces/bubble.interface'
import { TurnAndHint } from '../interfaces/turn-and-hint.interface'
import { TurnService } from './turn-service'

@Injectable({
	providedIn: 'root',
})
export class HintService {
	private readonly turnService = inject(TurnService)

	hasRemainingHints(hints: TurnAndHint[]) {
		return hints.some((hint) => hint.available)
	}

	numberOfHintsLeft(hints: TurnAndHint[]) {
		return hints.filter((hint) => hint.available).length
	}

	useHint(hints: TurnAndHint[], turns: TurnAndHint[]) {
		let currentHintIndex = -1
		hints.forEach((hint, index) => {
			if (hint.available) {
				currentHintIndex = index
			}
		})

		if (currentHintIndex === -1) {
			throw new Error('No available hints to use')
		}

		const numberOfTurnsLeft = this.turnService.numberOfTurnsLeft(turns)
		if (numberOfTurnsLeft > 1) {
			turns = this.turnService.useTurn(turns)
		}

		hints[currentHintIndex].available = false
		return { hints, turns }
	}

	getHintTriadBubbles(bubbles: Bubble[]) {
		if (bubbles.length < 3) {
			throw new Error('Not enough bubbles to get a hint')
		}

		const [fistBubble] = bubbles

		const bubblesWithCommonKeyword = bubbles.filter((bubble) => bubble.commonWordId === fistBubble.commonWordId)
		if (bubblesWithCommonKeyword.length < 3) {
			throw new Error('Not enough bubbles to get a hint')
		}

		return bubblesWithCommonKeyword
	}
}
