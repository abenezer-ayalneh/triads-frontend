import { ComponentFixture, TestBed } from '@angular/core/testing'

import { HintsBox } from './hints-box'

describe('HintsBox', () => {
	let component: HintsBox
	let fixture: ComponentFixture<HintsBox>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HintsBox],
		}).compileComponents()

		fixture = TestBed.createComponent(HintsBox)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
