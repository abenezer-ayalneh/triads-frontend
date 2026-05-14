import { Injectable } from '@angular/core'

/**
 * One-shot gate for `/play` in the daily app: `BrainWarmingPlayButton` calls {@link markPending}
 * immediately before navigating; {@link dailyPlayGuard} consumes it so direct URL entry and other
 * navigations redirect to `/`.
 */
@Injectable({ providedIn: 'root' })
export class DailyPlayRouteIntentService {
	private pending = false

	markPending(): void {
		this.pending = true
	}

	consumePending(): boolean {
		const ok = this.pending
		this.pending = false
		return ok
	}
}
