import { Injectable } from '@angular/core'

import { TurnAndHint } from '../interfaces/turn-and-hint.interface'

@Injectable({
	providedIn: 'root',
})
export class TurnService {
	numberOfAvailableTurns(turns: TurnAndHint[]) {
		return turns.filter((turn) => turn.available).length
	}

	useTurn(turns: TurnAndHint[]) {
		let currentTurnIndex = -1
		turns.forEach((turn, index) => {
			if (turn.available) {
				currentTurnIndex = index
			}
		})

		if (currentTurnIndex === -1) {
			throw new Error('No available turns to use')
		}

		turns[currentTurnIndex].available = false
		return turns
	}
}
