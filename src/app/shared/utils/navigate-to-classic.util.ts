import { Router } from '@angular/router'

import { Difficulty } from '../enums/difficulty.enum'
import { DifficultyService } from '../services/difficulty.service'
import { PlayRouteIntentService } from '../services/play-route-intent.service'

export interface NavigateToClassicDeps {
	difficultyService: DifficultyService
	store: { setGameMode: (mode: 'classic' | 'daily') => void }
	playRouteIntent: PlayRouteIntentService
	router: Router
}

export function navigateToClassicFromPlayMore(difficulty: Difficulty, deps: NavigateToClassicDeps): void {
	deps.difficultyService.setDifficulty(difficulty)
	deps.store.setGameMode('classic')
	deps.playRouteIntent.markPending()
	void deps.router.navigate(['/classic'])
}
