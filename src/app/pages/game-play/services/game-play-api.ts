import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'

import { SolvedTriad } from '../interfaces/triad.interface'

@Injectable({
	providedIn: 'root',
})
export class GamePlayApi {
	private readonly httpClient = inject(HttpClient)

	getCues() {
		return this.httpClient.get<string[]>('triads/cues')
	}

	checkTriad(cues: string[]) {
		return this.httpClient.get<boolean>('triads/check-triad', { params: { cues } })
	}

	checkAnswer(cues: string[], answer: string) {
		return this.httpClient.get<boolean | SolvedTriad>('triads/check-answer', { params: { cues, answer } })
	}

	fetchFinalTriadCues(triadsIds: number[]) {
		return this.httpClient.get<string[]>('triads/fourth-triad-cues', { params: { triadsIds } })
	}
}
