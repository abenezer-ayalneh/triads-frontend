import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { InputSet } from './input-set'

describe('InputSet', () => {
	let component: InputSet
	let fixture: ComponentFixture<InputSet>

	beforeEach(waitForAsync(() => {
		TestBed.configureTestingModule({
			declarations: [InputSet],
			imports: [],
		}).compileComponents()

		fixture = TestBed.createComponent(InputSet)
		component = fixture.componentInstance
		fixture.detectChanges()
	}))

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
