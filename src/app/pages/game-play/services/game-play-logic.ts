import { inject, Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

import { UserService } from '../../../shared/services/user.service'
import { GlobalStore } from '../../../state/global.store'
import { GamePlayState } from '../enums/game-play.enum'

@Injectable({
	providedIn: 'root',
})
export class GamePlayLogic {
	readonly store = inject(GlobalStore)

	private readonly userService = inject(UserService)

	answerFieldFocus$ = new BehaviorSubject<boolean>(false)

	answerFieldValue$ = new BehaviorSubject<string | null>(null)

	handleGameWon() {
		const user = this.store.user()

		if (user) {
			const newScore = user.score + this.store.gameScore()
			this.store.setGamePlayState(GamePlayState.WON)
			this.store.setUserScore(newScore)
			this.userService.setUser({ ...user, score: newScore })
		}
	}
}
