import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'

import { AnonymousIdService } from '../services/anonymous-id.service'

export const anonymousIdInterceptor: HttpInterceptorFn = (req, next) => {
	if (!req.url.includes('/triads/daily')) {
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
