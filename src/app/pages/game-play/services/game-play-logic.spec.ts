import { TestBed } from '@angular/core/testing'

import { GamePlayLogic } from './game-play-logic'

describe('GamePlayLogic', () => {
	let service: GamePlayLogic

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(GamePlayLogic)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
