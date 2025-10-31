import { Directive, ElementRef, HostListener, inject, output } from '@angular/core'

@Directive({
	selector: '[appClickOutside]', // Use a specific selector, e.g., 'appClickOutside'
})
export class ClickOutsideDirective {
	appClickOutside = output<void>()

	private elementRef = inject(ElementRef)

	@HostListener('document:click', ['$event.target'])
	onClick(targetElement: HTMLElement) {
		const clickedInside = this.elementRef.nativeElement.contains(targetElement)
		if (!clickedInside) {
			this.appClickOutside.emit()
		}
	}
}
