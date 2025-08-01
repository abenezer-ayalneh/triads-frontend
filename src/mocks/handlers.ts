import { http, HttpResponse } from 'msw'

import { CueGroup } from '../app/pages/game-play/interfaces/cue.interface'
import { environment } from '../environments/environment'

const API_URL = environment.apiUrl

export const handlers = [
	http.get(`${API_URL}/cues`, () => {
		return HttpResponse.json<CueGroup[]>([
			{
				id: 532,
				common: 'WINNER',
				cues: [
					{ id: 1, name: 'PRIZE' },
					{ id: 2, name: 'OSCAR' },
					{ id: 3, name: 'BREAD' },
				],
			},
			{
				id: 500,
				common: 'PIANO',
				cues: [
					{ id: 4, name: 'UPRIGHT' },
					{ id: 5, name: 'TUNER' },
					{ id: 6, name: 'KEYS' },
				],
			},
			{
				id: 391,
				common: 'SLAP',
				cues: [
					{ id: 7, name: 'STICK' },
					{ id: 8, name: 'IN THE FACE' },
					{ id: 9, name: 'HAPPY' },
				],
			},
		])
	}),
]
