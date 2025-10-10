import { inject, Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

import { UserService } from '../../../shared/services/user.service'
import { GlobalStore } from '../../../state/global.store'
import { GamePlayState } from '../enums/game-play.enum'
import { HintService } from './hint-service'
import { TurnService } from './turn-service'

@Injectable({
	providedIn: 'root',
})
export class GamePlayLogic {
	private readonly store = inject(GlobalStore)

	private readonly userService = inject(UserService)

	private readonly hintService = inject(HintService)

	private readonly turnService = inject(TurnService)

	answerFieldFocus$ = new BehaviorSubject<boolean>(false)

	answerFieldValue$ = new BehaviorSubject<string | null>(null)

	decideGameResult() {
		if (
			this.store.cues() !== null &&
			this.store.cues()?.length === 0 &&
			this.store.finalTriadCues() !== null &&
			Array.isArray(this.store.finalTriadCues()) &&
			this.store.finalTriadCues()?.length === 0
		) {
			return GamePlayState.WON
		} else if (this.store.turns().filter((turn) => turn.available).length === 0) {
			return GamePlayState.LOST
		}

		return this.store.gamePlayState()
	}

	handleGameWon() {
		// Score updates
		const score = this.calculateScore()

		// User state updates
		const user = this.store.user()
		this.store.setGameScore(score)

		if (user) {
			const newScore = user.score + score
			this.store.setGamePlayState(GamePlayState.WON)
			this.store.setUserScore(newScore)
			this.userService.setUser({ ...user, score: newScore })
		}
	}

	calculateScore() {
		const availableTurns = this.turnService.numberOfAvailableTurns(this.store.turns())
		const availableHints = this.hintService.numberOfAvailableHints(this.store.hints())

		// A perfect score! Got all 4 Triads with no misses, no hints => 15
		if (availableTurns === 3 && availableHints === 2) {
			return 15
		}
		// Success (all 4 solved) but with either 1 miss or 1 hint => 12
		else if ((availableTurns === 2 && availableHints === 2) || (availableTurns === 2 && availableHints === 1)) {
			return 12
		}
		// Success (all 4), but with 2 misses and/or hints => 10
		else if ((availableTurns === 1 && availableHints === 2) || (availableTurns === 1 && availableHints === 0)) {
			return 10
		}

		return 0
	}
}
