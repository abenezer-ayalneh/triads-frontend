import { Injectable } from '@angular/core'

const STORAGE_KEY = 'triads_anonymous_id'

@Injectable({
	providedIn: 'root',
})
export class AnonymousIdService {
	getOrCreateId(): string {
		let id = localStorage.getItem(STORAGE_KEY)
		if (!id) {
			id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
			localStorage.setItem(STORAGE_KEY, id)
		}
		return id
	}

	clearId(): void {
		localStorage.removeItem(STORAGE_KEY)
	}
}
