import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideRouter } from '@angular/router'

import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
	providers: [provideAnimations(), provideAnimationsAsync(), provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)],
}
