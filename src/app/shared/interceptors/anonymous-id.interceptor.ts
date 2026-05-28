import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'

import { AnonymousIdService } from '../services/anonymous-id.service'

export const anonymousIdInterceptor: HttpInterceptorFn = (req, next) => {
	const needsAnonymousId = req.url.includes('/triads/daily') || req.url.includes('/triads/cues')
	if (!needsAnonymousId) {
		return next(req)
	}

	const anonymousIdService = inject(AnonymousIdService)
	const id = anonymousIdService.getOrCreateId()

	return next(
		req.clone({
			setHeaders: {
				'x-anonymous-id': id,
			},
		}),
	)
}
