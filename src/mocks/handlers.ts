import { http, HttpResponse } from 'msw'

import { CueGroup } from '../app/pages/game-play/interfaces/cue.interface'
import { environment } from '../environments/environment'

const API_URL = environment.apiUrl

export const handlers = [
	http.get(`${API_URL}/cues`, () => {
		return HttpResponse.json<CueGroup[]>([
			{
				id: 532,
				commonWord: 'WINNER',
				cues: [
					{ id: 1, word: 'PRIZE' },
					{ id: 2, word: 'OSCAR' },
					{ id: 3, word: 'BREAD' },
				],
			},
			{
				id: 500,
				commonWord: 'PIANO',
				cues: [
					{ id: 4, word: 'UPRIGHT' },
					{ id: 5, word: 'TUNER' },
					{ id: 6, word: 'KEYS' },
				],
			},
			{
				id: 391,
				commonWord: 'SLAP',
				cues: [
					{ id: 7, word: 'STICK' },
					{ id: 8, word: 'IN THE FACE' },
					{ id: 9, word: 'HAPPY' },
				],
			},
		])
	}),
	http.post<{ answer: string }>(`${API_URL}/answer`, async ({ request }) => {
		const requestBody = await request.clone().json()
		return HttpResponse.json<boolean>(requestBody.answer === 'c')
	}),
	http.post<{ answer: string }>(`${API_URL}/triads`, async ({ request }) => {
		const requestBody = await request.clone().json()
		return HttpResponse.json<boolean>(requestBody.triadIds.includes(1))
	}),
]
