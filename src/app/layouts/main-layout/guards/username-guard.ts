import { inject } from '@angular/core'
import { CanActivateFn, RedirectCommand, Router } from '@angular/router'

export const usernameGuard: CanActivateFn = () => {
	const router = inject(Router)

	if (localStorage.getItem('username')) {
		return true
	}

	return new RedirectCommand(router.parseUrl('home'), {
		replaceUrl: true,
		onSameUrlNavigation: 'ignore',
	})
}
