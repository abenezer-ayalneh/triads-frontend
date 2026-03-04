import { Component } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ClickOutsideDirective } from './click-outside'

@Component({
	standalone: true,
	imports: [ClickOutsideDirective],
	template: '<div appClickOutside>Content</div>',
})
class TestHostComponent {}

describe('ClickOutsideDirective', () => {
	let fixture: ComponentFixture<TestHostComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestHostComponent],
		}).compileComponents()
		fixture = TestBed.createComponent(TestHostComponent)
		fixture.detectChanges()
	})

	it('should create an instance', () => {
		expect(fixture.componentInstance).toBeTruthy()
	})
})
