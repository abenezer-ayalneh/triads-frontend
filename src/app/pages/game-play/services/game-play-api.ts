import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'

import { Difficulty } from '../../../shared/enums/difficulty.enum'
import { SolvedTriad } from '../interfaces/triad.interface'

export type DailyTodayInfoResponse =
	| {
			scheduled: false
			puzzleDate: string
	  }
	| {
			scheduled: true
			puzzleDate: string
			triadGroupId: number
			/** Set when the request includes x-anonymous-id; true if today’s puzzle is finished (won or lost). */
			hasCompletedDaily?: boolean
	  }

export type DailyCuesResponse =
	| {
			scheduled: false
			puzzleDate: string
			nextPuzzleAt: string
			message: string
	  }
	| {
			scheduled: true
			alreadyCompleted: true
			attemptStatus: 'WON' | 'LOST'
			score: number | null
			triadGroupId: number
			puzzleDate: string
			nextPuzzleAt: string
			cues: null
	  }
	| {
			scheduled: true
			alreadyCompleted: false
			attemptStatus: 'IN_PROGRESS'
			triadGroupId: number
			cues: string[]
			puzzleDate: string
			nextPuzzleAt: string
	  }

@Injectable({
	providedIn: 'root',
})
export class GamePlayApi {
	private readonly httpClient = inject(HttpClient)

	getDailyTodayInfo() {
		return this.httpClient.get<DailyTodayInfoResponse>('triads/daily/today')
	}

	getDailyCues() {
		return this.httpClient.get<DailyCuesResponse>('triads/daily/cues')
	}

	postDailyComplete(outcome: 'won' | 'lost', score: number) {
		return this.httpClient.post<{ ok: true; puzzleDate: string; nextPuzzleAt: string }>('triads/daily/complete', {
			outcome,
			score,
		})
	}

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

	fetchFourthTriadSolution(triadGroupId: number | string) {
		return this.httpClient.get<SolvedTriad>('triads/fourth-triad-solution', { params: { triadGroupId } })
	}

	getTriadGroupSolutions(triadGroupId: string | number) {
		return this.httpClient.get<SolvedTriad[]>(`triads/groups/${triadGroupId}/triads`)
	}
}
