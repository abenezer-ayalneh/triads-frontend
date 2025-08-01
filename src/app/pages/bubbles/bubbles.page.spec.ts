import { ComponentFixture, TestBed } from '@angular/core/testing'

import { BubblesPage } from './bubbles.page'

describe('BubblesPage', () => {
	let component: BubblesPage
	let fixture: ComponentFixture<BubblesPage>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [BubblesPage],
		}).compileComponents()

		fixture = TestBed.createComponent(BubblesPage)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
