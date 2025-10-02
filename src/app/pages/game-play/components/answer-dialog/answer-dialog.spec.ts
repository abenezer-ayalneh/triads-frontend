import { ComponentFixture, TestBed } from '@angular/core/testing'

import { AnswerDialog } from './answer-dialog'

describe('AnswerDialog', () => {
	let component: AnswerDialog
	let fixture: ComponentFixture<AnswerDialog>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AnswerDialog],
		}).compileComponents()

		fixture = TestBed.createComponent(AnswerDialog)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
