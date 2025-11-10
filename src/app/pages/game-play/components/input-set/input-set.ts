import { AfterViewInit, Component, effect, ElementRef, input, OnDestroy, output, viewChildren } from '@angular/core'
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Subscription } from 'rxjs'

import { AutoCapitalize } from '../../../../shared/directives/auto-capitalize'

@Component({
	selector: 'app-input-set',
	templateUrl: './input-set.html',
	styleUrls: ['./input-set.scss'],

	standalone: true,
	imports: [ReactiveFormsModule, AutoCapitalize],
})
export class InputSet implements AfterViewInit, OnDestroy {
	subscriptions$ = new Subscription()

	quantity = input.required<number>()

	whenSubmitClicked = output<string>()

	inputRefs = viewChildren<ElementRef<HTMLInputElement>>('inputBoxRef')

	inputSetFormGroup = new FormGroup({
		inputBoxes: new FormArray<FormControl<string | null>>([]),
	})

	constructor() {
		effect(() => {
			const element = this.inputRefs()[0]?.nativeElement

			// After all input fields are initialized, focus on the first one
			if (element) {
				element.focus()
			}
		})
	}

	get inputBoxes() {
		return this.inputSetFormGroup.get('inputBoxes') as FormArray<FormControl<string | null>>
	}

	ngAfterViewInit(): void {
		for (let i = 0; i < this.quantity(); i++) {
			const newControl: FormControl<string | null> = new FormControl<string | null>(null, {
				validators: [Validators.required, Validators.minLength(1), Validators.maxLength(1)],
			})
			this.inputBoxes.push(newControl)
		}
	}

	ngOnDestroy() {
		this.subscriptions$.unsubscribe()
	}

	/**
	 * Handles input events for the input fields, giving focus to the next input field if the current field is filled and valid.
	 *
	 * @param {number} index - The index of the current input field.
	 * @return {void} This method does not return a value.
	 */
	onInput(index: number): void {
		const controls = this.inputBoxes as FormArray
		if (controls.at(index).valid && index >= 0 && index < this.inputRefs().length - 1) {
			this.inputRefs()[index + 1].nativeElement.focus()
		}
	}

	/**
	 * Handles the keydown event for an input element and delete the content & move to the previous
	 * input field when the 'Backspace' key is pressed.
	 *
	 * @param {KeyboardEvent} event - The keyboard event object triggered by the keydown action.
	 * @param {number} index - The index of the current input field in the sequence.
	 * @return {void} This method does not return any value.
	 */
	onKeydown(event: KeyboardEvent, index: number): void {
		if (event.key === 'Backspace' && index > 0) {
			if (this.inputRefs()[index].nativeElement.value === '') {
				this.inputRefs()[index - 1].nativeElement.focus()
				this.inputRefs()[index - 1].nativeElement.select()
			}
		}
	}

	/**
	 * Handles the focus event for the specified input element by selecting its content.
	 *
	 * @param {number} index - The zero-based index of the input element to focus and select.
	 * @return {void} This method does not return a value.
	 */
	onFocus(index: number): void {
		this.inputRefs()[index].nativeElement.select()
	}

	submitAnswer() {
		if (this.inputSetFormGroup.valid) {
			this.whenSubmitClicked.emit(this.inputBoxes.value.join(''))
		}
	}
}
