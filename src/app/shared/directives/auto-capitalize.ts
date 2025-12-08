import { Directive, HostListener, inject } from '@angular/core'
import { NgControl } from '@angular/forms'

@Directive({
	selector: '[appAutoCapitalize]',
})
export class AutoCapitalize {
	private readonly ngControl = inject(NgControl, { optional: true, self: true })

	@HostListener('input', ['$event'])
	onInput(event: Event) {
		const target = event.target as HTMLInputElement
		const cursorPosition = target.selectionStart
		const upperValue = target.value.toUpperCase()

		// Update the form control value first (if it exists)
		if (this.ngControl?.control) {
			this.ngControl.control.setValue(upperValue, { emitEvent: false })
		}

		// Update the visual value
		target.value = upperValue

		// Restore cursor position
		if (cursorPosition !== null) {
			target.setSelectionRange(cursorPosition, cursorPosition)
		}
	}
}
