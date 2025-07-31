import { Injectable } from '@angular/core'

import { ADJECTIVES, NOUNS } from './data/username-generator.data'

@Injectable({
	providedIn: 'root',
})
export class UserInfoDialogService {
	/**
	 * Get the user's stored information.
	 *
	 * @returns {string | null} - Returns the username if it is found, or it returns null.
	 */
	getUsername(): string | null {
		return localStorage.getItem('username')
	}

	/**
	 * Get the user's stored information.
	 *
	 * @returns {void} - Returns the username if it is found, or it returns null.
	 */
	setUsername(username: string): void {
		localStorage.setItem('username', username)
	}

	generateUsername(): string {
		const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
		const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
		const number = Math.floor(Math.random() * 100)
			.toString()
			.padStart(2, '0')

		const capitalizedAdjective = adjective.charAt(0).toUpperCase() + adjective.slice(1)
		const capitalizedNoun = noun.charAt(0).toUpperCase() + noun.slice(1)

		return `${capitalizedAdjective}${capitalizedNoun}${number}`
	}
}
