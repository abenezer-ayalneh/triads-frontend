import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, CanActivateFn, RedirectCommand, Router } from '@angular/router'
import { catchError, map, of } from 'rxjs'

import { GamePlayApi } from '../../../pages/game-play/services/game-play-api'
import { PlayRouteIntentService } from '../../../shared/services/play-route-intent.service'
import { UserService } from '../../../shared/services/user.service'
import { GlobalStore } from '../../../state/global.store'

type PlayMode = 'classic' | 'daily'

function readModeFromRoute(route: ActivatedRouteSnapshot): PlayMode {
	const mode = route.data['mode']
	return mode === 'daily' ? 'daily' : 'classic'
}

function redirectToHome(router: Router): RedirectCommand {
	return new RedirectCommand(router.parseUrl('/'), {
		replaceUrl: true,
		onSameUrlNavigation: 'ignore',
	})
}

export const playGuard: CanActivateFn = (route) => {
	const store = inject(GlobalStore)
	const router = inject(Router)
	const gamePlayApi = inject(GamePlayApi)
	const userService = inject(UserService)
	const playRouteIntent = inject(PlayRouteIntentService)

	const mode = readModeFromRoute(route)
	store.setGameMode(mode)

	if (!userService.getUser()) {
		return redirectToHome(router)
	}

	if (!playRouteIntent.consumePending()) {
		return redirectToHome(router)
	}

	if (mode !== 'daily') {
		return true
	}

	return gamePlayApi.getDailyTodayInfo().pipe(
		map((info) => {
			if (info.scheduled && info.hasCompletedDaily === true) {
				return redirectToHome(router)
			}
			return true
		}),
		catchError(() => of(true)),
	)
}
