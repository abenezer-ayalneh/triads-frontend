import { ComponentFixture, TestBed } from '@angular/core/testing'

import { SolvedTriad } from './solved-triad'

describe('SolvedTriad', () => {
	let component: SolvedTriad
	let fixture: ComponentFixture<SolvedTriad>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [SolvedTriad],
		}).compileComponents()

		fixture = TestBed.createComponent(SolvedTriad)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
