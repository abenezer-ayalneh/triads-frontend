import { ComponentFixture, TestBed } from '@angular/core/testing'

import { SolutionSection } from './solution-section'

describe('SolutionSection', () => {
	let component: SolutionSection
	let fixture: ComponentFixture<SolutionSection>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [SolutionSection],
		}).compileComponents()

		fixture = TestBed.createComponent(SolutionSection)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
