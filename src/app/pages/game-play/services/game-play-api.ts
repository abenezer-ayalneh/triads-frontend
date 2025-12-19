import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'

import { Difficulty } from '../../../shared/enums/difficulty.enum'
import { SolvedTriad } from '../interfaces/triad.interface'

@Injectable({
	providedIn: 'root',
})
export class GamePlayApi {
	private readonly httpClient = inject(HttpClient)

	getCues(difficulty: Difficulty) {
		const params = new HttpParams().set('difficulty', difficulty)
		return this.httpClient.get<{ triadGroupId: string | number | null; cues: string[] | null; message?: string }>('triads/cues', { params })
	}

	checkTriad(cues: string[]) {
		return this.httpClient.get<boolean>('triads/check-triad', { params: { cues } })
	}

	checkAnswer(cues: string[], answer: string) {
		return this.httpClient.get<boolean | SolvedTriad>('triads/check-answer', { params: { cues, answer } })
	}

	fetchFinalTriadCues(triadGroupId: number | string) {
		return this.httpClient.get<string[]>('triads/fourth-triad-cues', { params: { triadGroupId } })
	}

	getTriadGroupSolutions(triadGroupId: string | number) {
		return this.httpClient.get<SolvedTriad[]>(`triads/groups/${triadGroupId}/triads`)
	}
}
