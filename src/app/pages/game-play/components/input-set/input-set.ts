import { AfterViewChecked, AfterViewInit, Component, effect, ElementRef, input, OnDestroy, output, viewChild, viewChildren } from '@angular/core'
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Subscription } from 'rxjs'

import { AutoCapitalize } from '../../../../shared/directives/auto-capitalize'
import { ReverseErase } from '../../../../shared/directives/reverse-erase'

@Component({
	selector: 'app-input-set',
	templateUrl: './input-set.html',
	styleUrls: ['./input-set.scss'],

	standalone: true,
	imports: [ReactiveFormsModule, AutoCapitalize, ReverseErase],
})
export class InputSet implements AfterViewInit, AfterViewChecked, OnDestroy {
	subscriptions$ = new Subscription()

	private timeoutIds: ReturnType<typeof setTimeout>[] = []

	private hasAttemptedFocus = false

	private visualViewportCleanup: (() => void) | undefined

	private ionScrollSlackCleanup: (() => void) | undefined

	quantity = input.required<number>()

	firstLetter = input<string | null>(null)

	isLoading = input<boolean>(false)

	whenSubmitClicked = output<string>()

	inputRefs = viewChildren<ElementRef<HTMLInputElement>>('inputBoxRef')

	private readonly reverseEraser = viewChild(ReverseErase)

	isErasing = false

	inputSetFormGroup = new FormGroup({
		inputBoxes: new FormArray<FormControl<string | null>>([]),
	})

	constructor() {
		effect(() => {
			const element = this.inputRefs()[0]?.nativeElement
			const firstLetterValue = this.firstLetter()

			// If first letter is set and input boxes exist, fill the first box
			if (firstLetterValue && this.inputBoxes.length > 0) {
				const firstControl = this.inputBoxes.at(0)
				if (firstControl) {
					// Only set if empty or if it's different (allows updating when hint is used after InputSet is created)
					if (!firstControl.value || firstControl.value !== firstLetterValue) {
						firstControl.setValue(firstLetterValue)
						// Focus on the second box if it exists
						if (this.inputRefs().length > 1) {
							const timeoutId = setTimeout(() => {
								const secondInput = this.inputRefs()[1]?.nativeElement
								if (secondInput) {
									secondInput.focus()
									// Trigger keyboard on mobile devices
									if (this.isMobileDevice()) {
										secondInput.click()
									}
								}
							}, 0)
							this.timeoutIds.push(timeoutId)
						}
					}
				}
			} else if (element && !firstLetterValue) {
				// After all input fields are initialized, focus on the first one if no first letter
				const timeoutId = setTimeout(() => {
					element.focus()
					// Trigger keyboard on mobile devices
					if (this.isMobileDevice()) {
						element.click()
					}
				}, 0)
				this.timeoutIds.push(timeoutId)
			}
		})

		// Watch isLoading signal and disable/enable all FormControls in the FormArray
		effect(() => {
			const loading = this.isLoading()
			const controls = this.inputBoxes.controls

			controls.forEach((control) => {
				if (loading) {
					control.disable()
				} else {
					control.enable()
				}
			})
		})
	}

	get inputBoxes() {
		return this.inputSetFormGroup.get('inputBoxes') as FormArray<FormControl<string | null>>
	}

	ngAfterViewInit(): void {
		for (let i = 0; i < this.quantity(); i++) {
			const initialValue = i === 0 && this.firstLetter() ? this.firstLetter() : null
			const newControl: FormControl<string | null> = new FormControl<string | null>(initialValue, {
				validators: [Validators.required, Validators.minLength(1), Validators.maxLength(1)],
			})
			this.inputBoxes.push(newControl)
		}
		// Try to focus immediately, but if component is hidden, AfterViewChecked will handle it
		this.attemptFocus()

		const vv = typeof window !== 'undefined' ? window.visualViewport : undefined
		if (vv) {
			const onVvChange = () => {
				if (vv.height >= window.innerHeight - 16) {
					this.clearIonScrollSlack()
				}
				const active = document.activeElement
				if (active instanceof HTMLInputElement && this.inputRefs().some((r) => r.nativeElement === active)) {
					this.scrollLetterInputIntoView(active)
				}
			}
			vv.addEventListener('resize', onVvChange)
			vv.addEventListener('scroll', onVvChange)
			this.visualViewportCleanup = () => {
				vv.removeEventListener('resize', onVvChange)
				vv.removeEventListener('scroll', onVvChange)
			}
		}
	}

	ngAfterViewChecked(): void {
		// If we haven't successfully focused yet and the component is now visible, try again
		if (!this.hasAttemptedFocus && this.isElementVisible()) {
			this.attemptFocus()
		}
	}

	ngOnDestroy() {
		this.subscriptions$.unsubscribe()
		// CRITICAL: Clear all pending timeouts
		this.timeoutIds.forEach((id) => clearTimeout(id))
		this.timeoutIds = []
		this.clearIonScrollSlack()
		this.visualViewportCleanup?.()
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
		if (this.isErasing) {
			event.preventDefault()
			return
		}
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
		const el = this.inputRefs()[index].nativeElement
		el.select()
		requestAnimationFrame(() => {
			this.scrollLetterInputIntoView(el)
			const t = setTimeout(() => this.scrollLetterInputIntoView(el), 400)
			this.timeoutIds.push(t)
		})
	}

	submitAnswer() {
		if (this.inputSetFormGroup.valid) {
			this.whenSubmitClicked.emit(this.inputBoxes.value.join(''))
		}
	}

	/**
	 * Call after a wrong answer when InputSet stays mounted (hints preserved) so focus returns to the letter boxes.
	 */
	focusForRetry(): void {
		this.hasAttemptedFocus = false
		const timeoutId = setTimeout(() => {
			this.attemptFocus()
		}, 0)
		this.timeoutIds.push(timeoutId)
	}

	/**
	 * Animates the letter boxes disappearing from the last to the first. When a first-letter hint is
	 * active, the first box (index 0) is preserved. Resolves when the sequence is complete, at which
	 * point focus has been restored to the appropriate box via {@link focusForRetry}.
	 */
	async playReverseErase(): Promise<void> {
		const eraser = this.reverseEraser()
		if (!eraser) {
			return
		}
		this.isErasing = true
		const targets = this.inputRefs().map((ref) => ref.nativeElement as HTMLElement)
		await eraser.play(targets)
	}

	onLetterErased(index: number): void {
		const control = this.inputBoxes.at(index)
		if (control) {
			control.reset()
		}
	}

	onReverseEraseFinished(): void {
		this.inputRefs().forEach((ref) => {
			const input = ref.nativeElement
			input.style.opacity = ''
			input.removeAttribute('aria-hidden')
		})
		this.isErasing = false
		this.focusForRetry()
	}

	/**
	 * Attempts to focus the appropriate input field based on whether first letter hint exists
	 */
	private attemptFocus(): void {
		if (this.inputRefs().length === 0) {
			return
		}

		const firstInput = this.inputRefs()[0]?.nativeElement
		if (!firstInput) {
			return
		}

		// Check if element is visible before attempting to focus
		if (!this.isElementVisible()) {
			return
		}

		// If first letter is set, focus on the second box if it exists
		if (this.firstLetter() && this.inputRefs().length > 1) {
			const secondInput = this.inputRefs()[1]?.nativeElement
			if (secondInput && document.activeElement !== secondInput) {
				const timeoutId = setTimeout(() => {
					if (this.isElementVisible()) {
						secondInput.focus()
						// Trigger keyboard on mobile devices
						if (this.isMobileDevice()) {
							secondInput.click()
						}
						// Verify focus was successful after a short delay
						const verifyTimeoutId = setTimeout(() => {
							if (document.activeElement === secondInput) {
								this.hasAttemptedFocus = true
							}
						}, 50)
						this.timeoutIds.push(verifyTimeoutId)
					}
				}, 0)
				this.timeoutIds.push(timeoutId)
			} else if (document.activeElement === secondInput) {
				this.hasAttemptedFocus = true
			}
		} else if (document.activeElement !== firstInput) {
			// Focus on the first input when "number of letters" hint is used (no first letter)
			const timeoutId = setTimeout(() => {
				if (this.isElementVisible()) {
					firstInput.focus()
					// Trigger keyboard on mobile devices
					if (this.isMobileDevice()) {
						firstInput.click()
					}
					// Verify focus was successful after a short delay
					const verifyTimeoutId = setTimeout(() => {
						if (document.activeElement === firstInput) {
							this.hasAttemptedFocus = true
						}
					}, 50)
					this.timeoutIds.push(verifyTimeoutId)
				}
			}, 0)
			this.timeoutIds.push(timeoutId)
		} else {
			// Already focused, mark as attempted
			this.hasAttemptedFocus = true
		}
	}

	/**
	 * Checks if the first input element is visible in the DOM
	 */
	private isElementVisible(): boolean {
		const firstInput = this.inputRefs()[0]?.nativeElement
		if (!firstInput) {
			return false
		}

		// Check if element has offsetParent (means it's visible and not hidden)
		// offsetParent is null when element or its parent has display:none, visibility:hidden, or position:fixed with no positioned ancestor
		const hasOffsetParent = firstInput.offsetParent !== null

		// Check if element has dimensions (means it's rendered)
		const rect = firstInput.getBoundingClientRect()
		const hasDimensions = rect.width > 0 && rect.height > 0

		// Element is visible if it has an offsetParent and dimensions
		// We don't check viewport position because the element might be in a scrollable container
		return hasOffsetParent && hasDimensions
	}

	/**
	 * Detects if the current device is a mobile device
	 */
	private isMobileDevice(): boolean {
		return (
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768 && 'ontouchstart' in window)
		)
	}

	private scrollLetterInputIntoView(el: HTMLInputElement): void {
		el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
		this.nudgeLetterInputIntoVisualViewport(el)
		if (this.isMobileDevice()) {
			for (const ms of [80, 220, 480]) {
				const id = setTimeout(() => void this.runNudgeLoop(el), ms)
				this.timeoutIds.push(id)
			}
		}
	}

	private nudgeLetterInputIntoVisualViewport(el: HTMLInputElement): void {
		void this.runNudgeLoop(el)
		requestAnimationFrame(() => void this.runNudgeLoop(el))
	}

	private async runNudgeLoop(el: HTMLInputElement): Promise<void> {
		const margin = 24
		for (let attempt = 0; attempt < 5; attempt++) {
			const vv = window.visualViewport
			if (!vv) {
				return
			}

			await this.ensureIonContentSlackIfClipped(el, vv, margin)
			await this.afterReflow()
			const rect = el.getBoundingClientRect()
			const visibleTop = vv.offsetTop + margin
			const visibleBottom = vv.offsetTop + vv.height - margin
			let dy = 0
			if (rect.bottom > visibleBottom) {
				dy = rect.bottom - visibleBottom
			} else if (rect.top < visibleTop) {
				dy = rect.top - visibleTop
			}
			if (Math.abs(dy) < 3) {
				return
			}
			await this.applyScrollDeltaAsync(dy)
			await this.afterReflow()
		}
	}

	private afterReflow(): Promise<void> {
		return new Promise((resolve) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => resolve())
			})
		})
	}

	private async ensureIonContentSlackIfClipped(el: HTMLInputElement, vv: VisualViewport, margin: number): Promise<void> {
		const rect = el.getBoundingClientRect()
		const visibleBottom = vv.offsetTop + vv.height - margin
		const hiddenBelow = rect.bottom - visibleBottom
		if (hiddenBelow <= 4) {
			return
		}

		const ion = document.querySelector('ion-content')
		if (!ion || !('getScrollElement' in ion)) {
			return
		}

		const scrollEl = await (ion as { getScrollElement: () => Promise<HTMLElement> }).getScrollElement()

		const extra = Math.ceil(hiddenBelow + 120)
		const prev = scrollEl.style.paddingBottom
		const prevNum = prev ? parseFloat(prev) : 0
		if (prevNum >= extra) {
			return
		}

		scrollEl.style.paddingBottom = `${extra}px`
		this.ionScrollSlackCleanup = () => {
			scrollEl.style.paddingBottom = ''
		}
		void scrollEl.offsetHeight
		el.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' })
	}

	private clearIonScrollSlack(): void {
		this.ionScrollSlackCleanup?.()
		this.ionScrollSlackCleanup = undefined
	}

	private async applyScrollDeltaAsync(dy: number): Promise<void> {
		const ion = document.querySelector('ion-content')
		if (ion && 'getScrollElement' in ion) {
			const scrollEl = await (ion as { getScrollElement: () => Promise<HTMLElement> }).getScrollElement()
			const maxScrollTop = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)
			const nextTop = Math.min(maxScrollTop, Math.max(0, scrollEl.scrollTop + dy))
			const before = scrollEl.scrollTop
			scrollEl.scrollTop = nextTop
			if (dy > 8 && Math.abs(scrollEl.scrollTop - before) < 2 && maxScrollTop < dy * 0.25) {
				window.scrollTo({ top: window.scrollY + dy, behavior: 'instant' })
			}
			return
		}

		const root = document.scrollingElement
		if (root) {
			const maxScrollTop = Math.max(0, root.scrollHeight - root.clientHeight)
			const nextTop = Math.min(maxScrollTop, Math.max(0, root.scrollTop + dy))
			const before = root.scrollTop
			root.scrollTop = nextTop
			if (dy > 8 && Math.abs(root.scrollTop - before) < 2) {
				window.scrollTo({ top: window.scrollY + dy, behavior: 'instant' })
			}
		}
	}
}
