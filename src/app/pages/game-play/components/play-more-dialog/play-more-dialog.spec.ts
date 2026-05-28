import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'

import { Difficulty } from '../../../../shared/enums/difficulty.enum'
import { DifficultyService } from '../../../../shared/services/difficulty.service'
import { PlayRouteIntentService } from '../../../../shared/services/play-route-intent.service'
import { GlobalStore } from '../../../../state/global.store'
import { PlayMoreDialog } from './play-more-dialog'

describe('PlayMoreDialog', () => {
	let component: PlayMoreDialog
	let fixture: ComponentFixture<PlayMoreDialog>
	let difficultyService: jasmine.SpyObj<DifficultyService>
	let store: jasmine.SpyObj<{ setGameMode: (mode: 'classic' | 'daily') => void }>
	let playRouteIntent: jasmine.SpyObj<PlayRouteIntentService>
	let router: jasmine.SpyObj<Router>

	beforeEach(async () => {
		difficultyService = jasmine.createSpyObj<DifficultyService>('DifficultyService', ['getDifficulty', 'setDifficulty'])
		difficultyService.getDifficulty.and.returnValue(Difficulty.MEDIUM)
		store = jasmine.createSpyObj('GlobalStore', ['setGameMode'])
		playRouteIntent = jasmine.createSpyObj<PlayRouteIntentService>('PlayRouteIntentService', ['markPending'])
		router = jasmine.createSpyObj<Router>('Router', ['navigate'])
		router.navigate.and.resolveTo(true)

		await TestBed.configureTestingModule({
			imports: [PlayMoreDialog],
			providers: [
				{ provide: DifficultyService, useValue: difficultyService },
				{ provide: GlobalStore, useValue: store },
				{ provide: PlayRouteIntentService, useValue: playRouteIntent },
				{ provide: Router, useValue: router },
			],
		}).compileComponents()

		fixture = TestBed.createComponent(PlayMoreDialog)
		component = fixture.componentInstance
		fixture.componentRef.setInput('remaining', 2)
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})

	it('renders played dot indicators', () => {
		const filledDots = fixture.nativeElement.querySelectorAll('.play-more-dialog__dot--filled')

		expect(filledDots.length).toBe(1)
	})

	it('renders games played label beside dot indicators', () => {
		const label = fixture.nativeElement.querySelector('.play-more-dialog__progress-label')

		expect(label?.textContent?.trim()).toBe('1/3')
	})

	it('shows no filled dots and 0/3 when no bonus games have been played', () => {
		fixture.componentRef.setInput('remaining', 3)
		fixture.detectChanges()

		const filledDots = fixture.nativeElement.querySelectorAll('.play-more-dialog__dot--filled')
		const label = fixture.nativeElement.querySelector('.play-more-dialog__progress-label')

		expect(filledDots.length).toBe(0)
		expect(label?.textContent?.trim()).toBe('0/3')
	})

	it('shows all filled dots and 3/3 when all bonus games have been played', () => {
		fixture.componentRef.setInput('remaining', 0)
		fixture.detectChanges()

		const filledDots = fixture.nativeElement.querySelectorAll('.play-more-dialog__dot--filled')
		const label = fixture.nativeElement.querySelector('.play-more-dialog__progress-label')

		expect(filledDots.length).toBe(3)
		expect(label?.textContent?.trim()).toBe('3/3')
	})

	it('navigates to classic and saves difficulty when Play Now is clicked', () => {
		component.selectedDifficulty.set(Difficulty.HARD)
		spyOn(component.whenClosed, 'emit')

		component.onPlayNow()

		expect(difficultyService.setDifficulty).toHaveBeenCalledWith(Difficulty.HARD)
		expect(store.setGameMode).toHaveBeenCalledWith('classic')
		expect(playRouteIntent.markPending).toHaveBeenCalled()
		expect(router.navigate).toHaveBeenCalledWith(['/classic'])
		expect(component.whenClosed.emit).toHaveBeenCalled()
	})

	it('does not navigate when no games remain', () => {
		fixture.componentRef.setInput('remaining', 0)
		fixture.detectChanges()
		spyOn(component.whenClosed, 'emit')

		component.onPlayNow()

		expect(router.navigate).not.toHaveBeenCalled()
		expect(component.whenClosed.emit).not.toHaveBeenCalled()
	})
})
