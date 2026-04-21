import { inject } from '@angular/core'
import { CanActivateFn, RedirectCommand, Router } from '@angular/router'
import { catchError, map, of } from 'rxjs'

import { GamePlayApi } from '../../pages/game-play/services/game-play-api'
import { UserService } from '../../shared/services/user.service'
import { GlobalStore } from '../../state/global.store'

export const dailyPlayGuard: CanActivateFn = () => {
	const store = inject(GlobalStore)
	const router = inject(Router)
	const gamePlayApi = inject(GamePlayApi)
	const userService = inject(UserService)

	if (store.gameMode() !== 'daily') {
		return true
	}

	if (!userService.getUser()) {
		return new RedirectCommand(router.parseUrl('/'), {
			replaceUrl: true,
			onSameUrlNavigation: 'ignore',
		})
	}

	return gamePlayApi.getDailyTodayInfo().pipe(
		map((info) => {
			if (info.scheduled && info.hasCompletedDaily === true) {
				return new RedirectCommand(router.parseUrl('/'), {
					replaceUrl: true,
					onSameUrlNavigation: 'ignore',
				})
			}
			return true
		}),
		catchError(() => of(true)),
	)
}
