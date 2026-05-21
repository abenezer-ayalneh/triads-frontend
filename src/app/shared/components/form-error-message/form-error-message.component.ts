import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core'
import { AbstractControl, FormControl } from '@angular/forms'
import { merge, Subscription } from 'rxjs'

import { getControlErrorMessage } from '../../errors/api-error.util'

@Component({
	selector: 'app-form-error-message',
	standalone: true,
	templateUrl: './form-error-message.component.html',
	styleUrl: './form-error-message.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorMessageComponent {
	control = input.required<AbstractControl | FormControl | null>()

	private readonly controlStateVersion = signal(0)

	message = computed(() => {
		this.controlStateVersion()
		return getControlErrorMessage(this.control())
	})

	private controlSubscription: Subscription | null = null

	constructor() {
		effect((onCleanup) => {
			this.controlSubscription?.unsubscribe()
			this.controlSubscription = null

			const control = this.control()
			if (!control) {
				return
			}

			this.controlSubscription = merge(control.statusChanges, control.valueChanges).subscribe(() => {
				this.controlStateVersion.update((version) => version + 1)
			})

			onCleanup(() => {
				this.controlSubscription?.unsubscribe()
				this.controlSubscription = null
			})
		})
	}
}
