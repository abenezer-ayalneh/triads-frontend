import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'

import { SolvedTriad, TriadGroupResponse } from '../interfaces/triad.interface'

@Injectable({
	providedIn: 'root',
})
export class GamePlayApi {
	private readonly httpClient = inject(HttpClient)

	getTriads() {
		return this.httpClient.get<TriadGroupResponse>('triads/groups')
	}

	checkTriad(cues: string[]) {
		return this.httpClient.get<boolean>('triads/check-triad', { params: { cues } })
	}

	checkAnswer(cues: string[], answer: string) {
		return this.httpClient.get<boolean | SolvedTriad>('triads/check-answer', { params: { cues, answer } })
	}
}
