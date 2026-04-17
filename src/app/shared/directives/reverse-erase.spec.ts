import { Component, viewChild } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ReverseErase } from './reverse-erase'

@Component({
	standalone: true,
	imports: [ReverseErase],
	template: `
		<div appReverseErase [preserveFirst]="preserveFirst" [stepDelay]="stepDelay" [animationDuration]="animationDuration">
			@for (letter of letters; track $index) {
				<span class="letter">{{ letter }}</span>
			}
		</div>
	`,
})
class HostComponent {
	letters = ['A', 'B', 'C', 'D']

	preserveFirst = false

	stepDelay = 0

	animationDuration = 0

	eraser = viewChild.required(ReverseErase)
}

describe('ReverseErase', () => {
	let fixture: ComponentFixture<HostComponent>
	let host: HostComponent
	let reducedMotionMatches = false

	beforeEach(() => {
		reducedMotionMatches = false
		const noop = () => undefined
		spyOn(window, 'matchMedia').and.callFake(
			() =>
				({
					matches: reducedMotionMatches,
					media: '(prefers-reduced-motion: reduce)',
					onchange: null,
					addListener: noop,
					removeListener: noop,
					addEventListener: noop,
					removeEventListener: noop,
					dispatchEvent: () => false,
				}) as unknown as MediaQueryList,
		)

		TestBed.configureTestingModule({ imports: [HostComponent] })
		fixture = TestBed.createComponent(HostComponent)
		host = fixture.componentInstance
		fixture.detectChanges()
	})

	function getLetterElements(): HTMLElement[] {
		return Array.from(fixture.nativeElement.querySelectorAll('.letter')) as HTMLElement[]
	}

	it('emits letterErased in last-to-first order then finished', async () => {
		const erasedIndices: number[] = []
		host.eraser().letterErased.subscribe((i) => erasedIndices.push(i))
		let finishedCount = 0
		host.eraser().finished.subscribe(() => finishedCount++)

		await host.eraser().play(getLetterElements())

		expect(erasedIndices).toEqual([3, 2, 1, 0])
		expect(finishedCount).toBe(1)
	})

	it('skips index 0 when preserveFirst is true', async () => {
		host.preserveFirst = true
		fixture.detectChanges()

		const erasedIndices: number[] = []
		host.eraser().letterErased.subscribe((i) => erasedIndices.push(i))

		await host.eraser().play(getLetterElements())

		expect(erasedIndices).toEqual([3, 2, 1])
	})

	it('emits finished immediately for empty targets without firing letterErased', async () => {
		const erasedIndices: number[] = []
		host.eraser().letterErased.subscribe((i) => erasedIndices.push(i))
		let finishedCount = 0
		host.eraser().finished.subscribe(() => finishedCount++)

		await host.eraser().play([])

		expect(erasedIndices).toEqual([])
		expect(finishedCount).toBe(1)
	})

	it('emits finished without letters erased when preserveFirst=true and only one target', async () => {
		host.letters = ['A']
		host.preserveFirst = true
		fixture.detectChanges()

		const erasedIndices: number[] = []
		host.eraser().letterErased.subscribe((i) => erasedIndices.push(i))
		let finishedCount = 0
		host.eraser().finished.subscribe(() => finishedCount++)

		await host.eraser().play(getLetterElements())

		expect(erasedIndices).toEqual([])
		expect(finishedCount).toBe(1)
	})

	it('short-circuits animation when prefers-reduced-motion is set', async () => {
		reducedMotionMatches = true

		const elements = getLetterElements()
		const animateSpies = elements.map((el) => spyOn(el, 'animate').and.callThrough())

		const erasedIndices: number[] = []
		host.eraser().letterErased.subscribe((i) => erasedIndices.push(i))

		await host.eraser().play(elements)

		expect(erasedIndices).toEqual([3, 2, 1, 0])
		animateSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled())
	})

	it('ignores a second play() while already playing', async () => {
		host.stepDelay = 10
		host.animationDuration = 10
		fixture.detectChanges()

		const erasedIndices: number[] = []
		host.eraser().letterErased.subscribe((i) => erasedIndices.push(i))

		const firstRun = host.eraser().play(getLetterElements())
		const secondRun = host.eraser().play(getLetterElements())

		await Promise.all([firstRun, secondRun])

		expect(erasedIndices).toEqual([3, 2, 1, 0])
	})
})
