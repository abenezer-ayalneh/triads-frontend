import { ComponentFixture, TestBed } from '@angular/core/testing'

import { UserInfoDialog } from './user-info-dialog'

describe('UserInfoDialog', () => {
	let component: UserInfoDialog
	let fixture: ComponentFixture<UserInfoDialog>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [UserInfoDialog],
		}).compileComponents()

		fixture = TestBed.createComponent(UserInfoDialog)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
