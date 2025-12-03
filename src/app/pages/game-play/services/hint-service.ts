import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'

import { TurnAndHint } from '../interfaces/turn-and-hint.interface'
import { TurnService } from './turn-service'

@Injectable({
	providedIn: 'root',
})
export class HintService {
	private readonly turnService = inject(TurnService)

	private readonly httpClient = inject(HttpClient)

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

		const numberOfTurnsLeft = this.turnService.numberOfAvailableTurns(turns)
		let turnDeferred = false

		// Only use a turn if more than 1 turn remains
		// If exactly 1 turn remains, defer the turn usage (it will be used on wrong answer)
		if (numberOfTurnsLeft > 1) {
			turns = this.turnService.useTurn(turns)
		} else if (numberOfTurnsLeft === 1) {
			turnDeferred = true
		}

		hints[currentHintIndex].available = false
		return { hints, turns, turnDeferred }
	}

	getHint(cues: string[], hintExtra?: 'KEYWORD_LENGTH' | 'FIRST_LETTER') {
		const params: { cues: string[]; with?: 'KEYWORD_LENGTH' | 'FIRST_LETTER' } = { cues }

		if (hintExtra !== undefined) {
			params.with = hintExtra
		}

		return this.httpClient.get<{ hint: string[] | null; with?: string; withValue?: string }>('triads/hint', { params })
	}

	numberOfAvailableHints(hints: TurnAndHint[]) {
		return hints.filter((hint) => hint.available).length
	}
}
