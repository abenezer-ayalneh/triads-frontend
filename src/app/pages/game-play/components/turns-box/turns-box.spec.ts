import { ComponentFixture, TestBed } from '@angular/core/testing'

import { TurnsBox } from './turns-box'

describe('TurnsBox', () => {
	let component: TurnsBox
	let fixture: ComponentFixture<TurnsBox>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TurnsBox],
		}).compileComponents()

		fixture = TestBed.createComponent(TurnsBox)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
