import { Injectable } from '@angular/core'

@Injectable({
	providedIn: 'root',
})
export class AdminAuthService {
	private readonly ADMIN_AUTH_KEY = 'admin_authenticated'

	private readonly ADMIN_PASSWORD = 'TriadsRules!'

	isAuthenticated(): boolean {
		const authStatus = localStorage.getItem(this.ADMIN_AUTH_KEY)
		return authStatus === 'true'
	}

	authenticate(password: string): boolean {
		if (password === this.ADMIN_PASSWORD) {
			localStorage.setItem(this.ADMIN_AUTH_KEY, 'true')
			return true
		}
		return false
	}

	logout() {
		localStorage.removeItem(this.ADMIN_AUTH_KEY)
	}
}
