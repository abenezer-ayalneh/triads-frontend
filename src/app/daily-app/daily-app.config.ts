import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideRouter } from '@angular/router'
import { provideIonicAngular } from '@ionic/angular/standalone'
import { provideLottieOptions } from 'ngx-lottie'

import { anonymousIdInterceptor } from '../shared/interceptors/anonymous-id.interceptor'
import { baseUrlInterceptor } from '../shared/interceptors/base-url.interceptor'
import { httpErrorsInterceptor } from '../shared/interceptors/http-errors.interceptor'
import { GlobalStore } from '../state/global.store'
import { dailyRoutes } from './daily.routes'

function initDailyMode(store: InstanceType<typeof GlobalStore>) {
	return () => {
		store.setGameMode('daily')
		return Promise.resolve()
	}
}

export const dailyAppConfig: ApplicationConfig = {
	providers: [
		provideIonicAngular({
			mode: 'ios',
		}),
		provideAnimations(),
		provideAnimationsAsync(),
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(dailyRoutes),
		provideHttpClient(withInterceptors([baseUrlInterceptor, anonymousIdInterceptor, httpErrorsInterceptor])),
		provideLottieOptions({
			player: () => import('lottie-web'),
		}),
		{
			provide: APP_INITIALIZER,
			useFactory: initDailyMode,
			deps: [GlobalStore],
			multi: true,
		},
	],
}
