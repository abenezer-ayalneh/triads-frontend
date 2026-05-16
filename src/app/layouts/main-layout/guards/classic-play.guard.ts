import { inject } from '@angular/core'
import { CanActivateFn, RedirectCommand, Router } from '@angular/router'

import { PlayRouteIntentService } from '../../../shared/services/play-route-intent.service'
import { GlobalStore } from '../../../state/global.store'

export const classicPlayGuard: CanActivateFn = () => {
	const store = inject(GlobalStore)
	const router = inject(Router)
	const playRouteIntent = inject(PlayRouteIntentService)

	if (store.gameMode() !== 'classic') {
		return true
	}

	if (!playRouteIntent.consumePending()) {
		return new RedirectCommand(router.parseUrl('/home'), {
			replaceUrl: true,
			onSameUrlNavigation: 'ignore',
		})
	}

	return true
}
