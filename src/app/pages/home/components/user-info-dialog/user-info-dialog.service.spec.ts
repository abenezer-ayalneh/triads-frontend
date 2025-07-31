import { TestBed } from '@angular/core/testing'

import { UserInfoDialogService } from './user-info-dialog.service'

describe('UserInfoDialogService', () => {
	let service: UserInfoDialogService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(UserInfoDialogService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
