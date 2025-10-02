import { ComponentFixture, TestBed } from '@angular/core/testing'

import { BackgroundBubbles } from './background-bubbles'

describe('BackgroundBubbles', () => {
	let component: BackgroundBubbles
	let fixture: ComponentFixture<BackgroundBubbles>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [BackgroundBubbles],
		}).compileComponents()

		fixture = TestBed.createComponent(BackgroundBubbles)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
