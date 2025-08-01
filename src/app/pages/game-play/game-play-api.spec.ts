import { TestBed } from '@angular/core/testing'

import { GamePlayApi } from './game-play-api'

describe('GamePlayApi', () => {
	let service: GamePlayApi

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(GamePlayApi)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
