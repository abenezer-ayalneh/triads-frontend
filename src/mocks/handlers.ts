import { http, HttpResponse } from 'msw'

import { SolvedTriad } from '../app/pages/game-play/interfaces/triad.interface'
import { environment } from '../environments/environment'

const API_URL = environment.apiUrl

export const handlers = [
	http.get(`${API_URL}/triads/cues`, () => {
		return HttpResponse.json<string[]>(['SLUSH', 'TRUST', 'HEDGE', 'FIRST', 'KITCHEN', 'PREP', 'CLOSE', 'SHIP', 'IMAGINARY'])
	}),
	http.get<{ cues: string[] }>(`${API_URL}/triads/check-triad`, () => {
		return new HttpResponse(true)
	}),
	http.get<{ cues: string[]; answer: string }>(`${API_URL}/triads/check-answer`, async ({ request }) => {
		const url = new URL(request.url)
		if (url.searchParams.get('answer') === 'c') {
			return HttpResponse.json<SolvedTriad>(
				{
					id: 1,
					keyword: 'FUND',
					cues: ['SLUSH', 'TRUST', 'HEDGE'],
					fullPhrases: ['SLUSH FUND', 'TRUST FUND', 'HEDGE FUND'],
				},
				{ status: 200 },
			)
		}

		return new HttpResponse(false)
	}),
	http.get<{ with?: 'KEYWORD_LENGTH' | 'FIRST_LETTER' }>(`${API_URL}/triads/hint`, ({ request }) => {
		const url = new URL(request.url)
		const hintExtra = url.searchParams.get('with') ?? undefined
		let withValue = undefined

		if (hintExtra === 'KEYWORD_LENGTH') {
			withValue = '4'
		} else if (hintExtra === 'FIRST_LETTER') {
			withValue = 'F'
		}

		return HttpResponse.json<{ hint: string[] | null; with?: string; withValue?: string }>({
			hint: ['CLOSE', 'SHIP', 'IMAGINARY'],
			with: hintExtra,
			withValue,
		})
	}),
]
