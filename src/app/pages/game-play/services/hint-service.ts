import { inject, Injectable } from '@angular/core'

import { CueGroup } from '../interfaces/cue.interface'
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

	getNumberOfAvailableHints(hints: TurnAndHint[]) {
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

	getHintTriadCues(cueGroups: CueGroup[], hints: TurnAndHint[]) {
		const unsolvedCueGroups = cueGroups.filter((cueGroup) => cueGroup.available)
		if (unsolvedCueGroups.length === 0) {
			throw new Error('Not enough cue to get a hint')
		}

		const randomlySelectedGroup = unsolvedCueGroups[Math.floor(Math.random() * unsolvedCueGroups.length)]

		return { cues: randomlySelectedGroup.cues, keywordLength: this.getNumberOfAvailableHints(hints) === 0 ? randomlySelectedGroup.commonWord.length : null }
	}
}
