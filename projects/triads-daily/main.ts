import { bootstrapApplication } from '@angular/platform-browser'

import { DailyApp } from '../../src/app/daily-app/daily-app'
import { dailyAppConfig } from '../../src/app/daily-app/daily-app.config'
import { AssetPreloadService } from '../../src/app/shared/services/asset-preload.service'

const SPLASH_FADE_OUT_MS = 400

function updateSplashProgress(percent: number): void {
	const bar = document.getElementById('app-splash-bar')
	const label = document.getElementById('app-splash-label')
	const clamped = Math.max(0, Math.min(100, Math.round(percent)))
	if (bar) {
		bar.style.width = `${clamped}%`
	}
	if (label) {
		label.textContent = `Loading ${clamped}%`
	}
}

function hideSplash(): void {
	const splash = document.getElementById('app-splash')
	if (!splash) {
		return
	}
	splash.dataset['fadeOut'] = 'true'
	window.setTimeout(() => splash.remove(), SPLASH_FADE_OUT_MS)
}

const assetPreloadService = new AssetPreloadService()

const assetsReady = assetPreloadService.preloadAll({
	onProgress: ({ loaded, total }) => {
		if (total === 0) {
			updateSplashProgress(100)
			return
		}
		updateSplashProgress((loaded / total) * 100)
	},
	timeoutMs: 15_000,
})

assetsReady
	.then(() => bootstrapApplication(DailyApp, dailyAppConfig))
	.catch((err) => console.error(err))
	.finally(() => {
		requestAnimationFrame(() => hideSplash())
	})
