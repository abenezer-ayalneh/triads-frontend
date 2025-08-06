import { http, HttpResponse } from 'msw'

import { CueGroup } from '../app/pages/game-play/interfaces/cue.interface'
import { environment } from '../environments/environment'

const API_URL = environment.apiUrl

export const handlers = [
	http.get(`${API_URL}/cues`, () => {
		return HttpResponse.json<CueGroup[]>([
			{
				id: 532,
				commonWord: 'MATE',
				available: true,
				cues: [
					{ id: 1, word: 'STALE' },
					{ id: 2, word: 'PLAY' },
					{ id: 3, word: 'IN' },
				],
			},
			{
				id: 500,
				commonWord: 'LIST',
				available: true,
				cues: [
					{ id: 4, word: 'HIT' },
					{ id: 5, word: 'GUEST' },
					{ id: 6, word: 'TO-DO' },
				],
			},
			{
				id: 391,
				commonWord: 'SPELL',
				available: true,
				cues: [
					{ id: 7, word: 'MAGIC' },
					{ id: 8, word: 'BOUND' },
					{ id: 9, word: 'DRY' },
				],
			},
			{
				id: 120,
				commonWord: 'CHECK',
				available: true,
				cues: [
					{ id: 10, word: 'MATE' },
					{ id: 11, word: 'LIST' },
					{ id: 12, word: 'SPELL' },
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
