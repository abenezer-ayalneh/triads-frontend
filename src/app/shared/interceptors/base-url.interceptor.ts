import { HttpInterceptorFn } from '@angular/common/http'
import { timeout } from 'rxjs'

import { environment } from '../../../environments/environment'

const BASE_URL = environment.apiUrl
const TIMEOUT = environment.timeout

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
	const newRequest = req.clone({
		url: `${BASE_URL}/${req.url}`,
	})

	return next(newRequest).pipe(timeout(TIMEOUT))
}
