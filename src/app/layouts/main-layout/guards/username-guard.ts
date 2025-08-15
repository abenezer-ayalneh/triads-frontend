import { inject } from '@angular/core'
import { CanActivateFn, RedirectCommand, Router } from '@angular/router'

import { UserService } from '../../../shared/services/user.service'

export const usernameGuard: CanActivateFn = () => {
	const router = inject(Router)
	const userService = inject(UserService)

	if (userService.getUser()) {
		return true
	}

	return new RedirectCommand(router.parseUrl('home'), {
		replaceUrl: true,
		onSameUrlNavigation: 'ignore',
	})
}
