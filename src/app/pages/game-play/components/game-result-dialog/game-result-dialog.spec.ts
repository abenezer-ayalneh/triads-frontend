import { ComponentFixture, TestBed } from '@angular/core/testing'

import { GameResultDialog } from './game-result-dialog'

describe('GameResultDialog', () => {
	let component: GameResultDialog
	let fixture: ComponentFixture<GameResultDialog>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [GameResultDialog],
		}).compileComponents()

		fixture = TestBed.createComponent(GameResultDialog)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
