import { Injectable } from '@angular/core'

/**
 * One-shot gate for `/play`: `BrainWarmingPlayButton` calls {@link markPending} immediately before
 * navigating; play route guards consume it so direct URL entry and other navigations redirect home.
 */
@Injectable({ providedIn: 'root' })
export class PlayRouteIntentService {
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
