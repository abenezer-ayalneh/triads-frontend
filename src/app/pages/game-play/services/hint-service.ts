import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import { Triad } from '../interfaces/triad.interface'
import { TurnAndHint } from '../interfaces/turn-and-hint.interface'
import { TurnService } from './turn-service'

@Injectable({
	providedIn: 'root',
})
export class HintService {
	private readonly turnService = inject(TurnService)

	private readonly httpClient = inject(HttpClient)

	hasRemainingHints(hints: TurnAndHint[]) {
		return hints.some((hint) => hint.available)
	}

	getNumberOfAvailableHints(hints: TurnAndHint[]) {
		return hints.filter((hint) => hint.available).length
	}

	useHint(hints: TurnAndHint[], turns: TurnAndHint[]) {
		let currentHintIndex = -1
		hints.forEach((hint, index) => {
			if (hint.available) {
				currentHintIndex = index
			}
		})

		if (currentHintIndex === -1) {
			throw new Error('No available hints to use')
		}

		const numberOfTurnsLeft = this.turnService.numberOfTurnsLeft(turns)
		if (numberOfTurnsLeft > 1) {
			turns = this.turnService.useTurn(turns)
		}

		hints[currentHintIndex].available = false
		return { hints, turns }
	}

	getHintTriadCues(triads: Triad[], hints: TurnAndHint[]): { cues: string[]; keywordLength: number | null } {
		const unsolvedTriad = triads.filter((triad) => triad.available)
		if (unsolvedTriad.length === 0) {
			throw new Error('Not enough cues to get a hint')
		}

		// Prefer the currently visible triad: either any initial available group,
		// or if only the fourth group remains available, pick that explicitly.
		let selectedTriad: Triad
		if (unsolvedTriad.length === 1) {
			selectedTriad = unsolvedTriad[0]
		} else {
			selectedTriad = unsolvedTriad[Math.floor(Math.random() * unsolvedTriad.length)]
		}

		let keywordLength = null
		if (this.getNumberOfAvailableHints(hints) === 0) {
			firstValueFrom(this.getKeywordLengthHint(selectedTriad.cues)).then((length) => {
				keywordLength = length
			})
		}

		return {
			cues: selectedTriad.cues,
			keywordLength,
		}
	}

	getKeywordLengthHint(cues: string[]) {
		return this.httpClient.get<number>('triads/keyword-length-hint', { params: { cues } })
	}

	getFirstLetterHint(cues: string[]) {
		return this.httpClient.get<string>('triads/first-letter-hint', { params: { cues } })
	}
}
