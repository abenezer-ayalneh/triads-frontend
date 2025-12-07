import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'

import { TriadValidationService } from '../../services/triad-validation.service'
import { AddTriadGroupDialog } from './add-triad-group-dialog'

describe('AddTriadGroupDialog', () => {
	let component: AddTriadGroupDialog
	let fixture: ComponentFixture<AddTriadGroupDialog>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AddTriadGroupDialog, ReactiveFormsModule],
			providers: [TriadValidationService],
		}).compileComponents()

		fixture = TestBed.createComponent(AddTriadGroupDialog)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})

	it('should emit whenCanceled on close', () => {
		spyOn(component.whenCanceled, 'emit')
		component.onClose()
		expect(component.whenCanceled.emit).toHaveBeenCalled()
	})

	it('should validate and emit whenCreated on valid submit', () => {
		// Fill form with valid data
		component.formGroup.patchValue({
			triad1: { keyword: 'TEST', cue1: 'TEST1', cue2: 'TEST2', cue3: 'TEST3' },
			triad2: { keyword: 'SAMPLE', cue1: 'SAMPLE1', cue2: 'SAMPLE2', cue3: 'SAMPLE3' },
			triad3: { keyword: 'DEMO', cue1: 'DEMO1', cue2: 'DEMO2', cue3: 'DEMO3' },
			triad4: { keyword: 'FINAL', cue1: 'TEST', cue2: 'SAMPLE', cue3: 'DEMO' },
		})

		spyOn(component.whenCreated, 'emit')
		component.onSubmit()
		expect(component.whenCreated.emit).toHaveBeenCalled()
	})
})
