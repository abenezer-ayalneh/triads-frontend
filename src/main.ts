import { isDevMode } from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'

import { App } from './app/app'
import { appConfig } from './app/app.config'

async function prepareApp() {
	if (isDevMode()) {
		const { worker } = await import('./mocks/browser')
		return worker.start()
	}

	return Promise.resolve()
}

prepareApp().then(() => bootstrapApplication(App, appConfig).catch((err) => console.error(err)))
