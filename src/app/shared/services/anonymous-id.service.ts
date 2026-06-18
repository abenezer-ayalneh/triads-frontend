import { Injectable } from '@angular/core'

const STORAGE_KEY = 'triads_anonymous_id'
const COOKIE_NAME = 'triads_anonymous_id'
// 400 days is the maximum Chrome will honour; Safari caps client-set cookies more aggressively but
// will still keep them well past the localStorage eviction window we're trying to survive.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400
const ANONYMOUS_ID_PATTERN = /^[a-zA-Z0-9-]{8,128}$/

@Injectable({
	providedIn: 'root',
})
export class AnonymousIdService {
	getOrCreateId(): string {
		// Mirror the id in two stores. iOS Safari's ITP can clear localStorage (storage pressure,
		// 7-day inactivity for sites flagged as trackers, etc.) while leaving a first-party cookie
		// in place — and vice versa. Reading from whichever store survives lets a returning Daily
		// player still hit the same server-side DailyTriadAttempt and resume in-progress state.
		const fromStorage = this.readFromStorage()
		const fromCookie = this.readFromCookie()
		const existing = fromStorage ?? fromCookie
		if (existing) {
			if (!fromStorage) this.writeToStorage(existing)
			if (!fromCookie) this.writeToCookie(existing)
			return existing
		}

		const id = this.generateId()
		this.writeToStorage(id)
		this.writeToCookie(id)
		return id
	}

	clearId(): void {
		try {
			localStorage.removeItem(STORAGE_KEY)
		} catch {
			// localStorage may be unavailable (private mode, disabled cookies); cookie fallback covers us.
		}
		document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
	}

	private readFromStorage(): string | null {
		try {
			const value = localStorage.getItem(STORAGE_KEY)
			return value && ANONYMOUS_ID_PATTERN.test(value) ? value : null
		} catch {
			return null
		}
	}

	private writeToStorage(id: string): void {
		try {
			localStorage.setItem(STORAGE_KEY, id)
		} catch {
			// Safari in private mode throws on write; cookie still records the id.
		}
	}

	private readFromCookie(): string | null {
		const match = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`))
		if (!match) return null
		const value = decodeURIComponent(match.slice(COOKIE_NAME.length + 1))
		return ANONYMOUS_ID_PATTERN.test(value) ? value : null
	}

	private writeToCookie(id: string): void {
		const secure = location.protocol === 'https:' ? '; Secure' : ''
		document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
	}

	private generateId(): string {
		if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
			return crypto.randomUUID()
		}
		return `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
	}
}
