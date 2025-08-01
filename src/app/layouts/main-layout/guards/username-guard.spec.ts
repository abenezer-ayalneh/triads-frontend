import { TestBed } from '@angular/core/testing'
import { CanActivateFn } from '@angular/router'

import { usernameGuard } from './username-guard'

describe('usernameGuard', () => {
	const executeGuard: CanActivateFn = (...guardParameters) => TestBed.runInInjectionContext(() => usernameGuard(...guardParameters))

	beforeEach(() => {
		TestBed.configureTestingModule({})
	})

	it('should be created', () => {
		expect(executeGuard).toBeTruthy()
	})
})
