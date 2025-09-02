import { isDevMode } from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'

import { App } from './app/app'
import { appConfig } from './app/app.config'
import { environment } from './environments/environment'

async function prepareApp() {
	if (isDevMode() && !environment.production) {
		const { worker } = await import('./mocks/browser')
		return worker.start()
	}

	return Promise.resolve()
}

prepareApp().then(() => bootstrapApplication(App, appConfig).catch((err) => console.error(err)))
