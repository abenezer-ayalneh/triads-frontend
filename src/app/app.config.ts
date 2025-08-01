import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideRouter } from '@angular/router'
import { provideLottieOptions } from 'ngx-lottie'

import { routes } from './app.routes'
import { baseUrlInterceptor } from './shared/interceptors/base-url.interceptor'
import { httpErrorsInterceptor } from './shared/interceptors/http-errors.interceptor'

export const appConfig: ApplicationConfig = {
	providers: [
		provideAnimations(),
		provideAnimationsAsync(),
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideHttpClient(withInterceptors([baseUrlInterceptor, httpErrorsInterceptor])),
		provideLottieOptions({
			player: () => import('lottie-web'),
		}),
	],
}
