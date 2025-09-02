import { http, HttpResponse } from 'msw'

import { TriadGroupResponse } from '../app/pages/game-play/interfaces/triad.interface'
import { environment } from '../environments/environment'

const API_URL = environment.apiUrl

export const handlers = [
	http.get(`${API_URL}/triads/groups`, () => {
		return HttpResponse.json<TriadGroupResponse>({
			id: 1,
			triads: [
				{
					id: 1,
					cues: ['SLUSH', 'TRUST', 'HEDGE'],
				},
				{
					id: 2,
					cues: ['FIRST', 'KITCHEN', 'PREP'],
				},
				{
					id: 3,
					cues: ['CLOSE', 'SHIP', 'IMAGINARY'],
				},
			],
		})
	}),
	http.get<{ cues: string[] }>(`${API_URL}/triads/check-triad`, () => {
		return new HttpResponse(true)
		// const requestBody = await request.clone().json()
		// return HttpResponse.json<boolean>(requestBody.triadIds.includes(1))
	}),
	http.get<{ cues: string[]; answer: string }>(`${API_URL}/triads/check-answer`, async ({ request }) => {
		const requestBody = await request.clone().json()
		return HttpResponse.json(
			requestBody.answer === 'c'
				? {
						id: 1,
						keyword: 'FUND',
						cues: ['SLUSH', 'TRUST', 'HEDGE'],
						fullPhrases: ['SLUSH FUND', 'TRUST FUND', 'HEDGE FUND'],
					}
				: false,
		)
	}),
	http.get<{ cues: string[]; answer: string }>(`${API_URL}/triads/keyword-length-hint`, () => {
		return new HttpResponse(4)
	}),
]
