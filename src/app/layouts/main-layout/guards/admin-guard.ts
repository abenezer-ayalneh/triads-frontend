import { inject } from '@angular/core'
import { CanActivateFn, RedirectCommand, Router } from '@angular/router'

import { AdminAuthService } from '../../../shared/services/admin-auth.service'

export const adminGuard: CanActivateFn = () => {
	const router = inject(Router)
	const adminAuthService = inject(AdminAuthService)

	if (adminAuthService.isAuthenticated()) {
		return true
	}

	return new RedirectCommand(router.parseUrl('home'), {
		replaceUrl: true,
		onSameUrlNavigation: 'ignore',
	})
}
