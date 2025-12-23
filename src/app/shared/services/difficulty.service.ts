import { Injectable } from '@angular/core'

import { Difficulty } from '../enums/difficulty.enum'

@Injectable({
	providedIn: 'root',
})
export class DifficultyService {
	private readonly STORAGE_KEY = 'difficulty'

	getDifficulty(): Difficulty {
		const stored = localStorage.getItem(this.STORAGE_KEY)
		if (stored && Object.values(Difficulty).includes(stored as Difficulty)) {
			return stored as Difficulty
		}
		return Difficulty.EASY
	}

	setDifficulty(difficulty: Difficulty): void {
		localStorage.setItem(this.STORAGE_KEY, difficulty)
	}
}
