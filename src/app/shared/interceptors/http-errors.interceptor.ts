import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { catchError, throwError } from 'rxjs'

import { parseApiError } from '../errors/api-error.util'
import { SnackbarService } from '../services/snackbar.service'

export const httpErrorsInterceptor: HttpInterceptorFn = (req, next) => {
	const snackbarService = inject(SnackbarService)

	return next(req).pipe(
		catchError((caughtError) => {
			const apiError = parseApiError(caughtError)

			queueMicrotask(() => {
				if (!apiError.handled) {
					snackbarService.showSnackbar(apiError.userMessage)
				}
			})

			return throwError(() => apiError)
		}),
	)
}
