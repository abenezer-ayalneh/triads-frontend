import { ComponentFixture, TestBed } from '@angular/core/testing'

import { QuitConfirmationDialog } from './quit-confirmation-dialog'

describe('QuitConfirmationDialog', () => {
	let component: QuitConfirmationDialog
	let fixture: ComponentFixture<QuitConfirmationDialog>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [QuitConfirmationDialog],
		}).compileComponents()

		fixture = TestBed.createComponent(QuitConfirmationDialog)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
