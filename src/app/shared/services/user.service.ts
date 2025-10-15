import { Injectable } from '@angular/core'

import { ADJECTIVES, NOUNS } from '../../pages/home/components/user-info-dialog/data/username-generator.data'
import { User } from '../interfaces/user.interface'

@Injectable({
	providedIn: 'root',
})
export class UserService {
	setUser(user: User) {
		localStorage.setItem('user', JSON.stringify(user))
	}

	clearUserData() {
		localStorage.removeItem('user')
	}

	/**
	 * Get the user's stored information.
	 *
	 * @returns {string | null} - Returns the username if it is found, or it returns null.
	 */
	getUser(): User | null {
		const parsedUser = JSON.parse(localStorage.getItem('user') ?? '{}') as User

		if (parsedUser && parsedUser.username && parsedUser.scores !== undefined && parsedUser.firstGameDate !== undefined) {
			return parsedUser
		}
		return null
	}

	/**
	 * Generates a random username by combining a capitalized adjective, a capitalized noun, and
	 * a two-digit number.
	 *
	 * @return {string} A randomly generated username, formatted as "AdjectiveNoun##".
	 */
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
