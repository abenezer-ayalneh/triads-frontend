import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'

import { CueGroup } from '../interfaces/cue.interface'

@Injectable({
	providedIn: 'root',
})
export class GamePlayApi {
	private readonly httpClient = inject(HttpClient)

	getCues() {
		return this.httpClient.get<CueGroup[]>('cues')
	}

	checkTriad(triadIds: number[]) {
		return this.httpClient.post<boolean>('triads', { triadIds })
	}

	checkAnswer(answer: string) {
		return this.httpClient.post<boolean>('answer', { answer })
	}
}
