import { afterNextRender, ChangeDetectionStrategy, Component, effect, ElementRef, inject, Injector, input, output, signal, ViewChild } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'

import { Dialog } from '../../../../shared/components/dialog/dialog'
import { FormErrorMessageComponent } from '../../../../shared/components/form-error-message/form-error-message.component'
import { AutoCapitalize } from '../../../../shared/directives/auto-capitalize'
import { Difficulty } from '../../../../shared/enums/difficulty.enum'
import { ApiError } from '../../../../shared/errors/api-error.model'
import { applyFieldErrors, clearServerErrors, collectFieldErrorMessages, TRIAD_GROUP_FIELD_MAP } from '../../../../shared/errors/api-error.util'
import { TriadGroupFormData } from '../../interfaces/triad-group.interface'
import { TriadValidationService } from '../../services/triad-validation.service'

@Component({
	selector: 'app-add-triad-group-dialog',
	standalone: true,
	imports: [ReactiveFormsModule, AutoCapitalize, Dialog, FormErrorMessageComponent],
	templateUrl: './add-triad-group-dialog.html',
	styleUrl: './add-triad-group-dialog.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTriadGroupDialog {
	apiError = input<ApiError | null>(null)

	isSubmitting = input<boolean>(false)

	whenCreated = output<TriadGroupFormData>()

	whenCanceled = output<void>()

	clientValidationErrors = signal<string[]>([])

	serverErrors = signal<string[]>([])

	readonly Difficulty = Difficulty

	@ViewChild(Dialog) dialogRef?: Dialog

	@ViewChild('errorBanner') errorBannerRef?: ElementRef<HTMLElement>

	formGroup = new FormGroup({
		difficulty: new FormControl<string>('', [Validators.required]),
		triad1: new FormGroup({
			keyword: new FormControl<string>('', [Validators.required]),
			fullPhrase1: new FormControl<string>('', [Validators.required]),
			fullPhrase2: new FormControl<string>('', [Validators.required]),
			fullPhrase3: new FormControl<string>('', [Validators.required]),
		}),
		triad2: new FormGroup({
			keyword: new FormControl<string>('', [Validators.required]),
			fullPhrase1: new FormControl<string>('', [Validators.required]),
			fullPhrase2: new FormControl<string>('', [Validators.required]),
			fullPhrase3: new FormControl<string>('', [Validators.required]),
		}),
		triad3: new FormGroup({
			keyword: new FormControl<string>('', [Validators.required]),
			fullPhrase1: new FormControl<string>('', [Validators.required]),
			fullPhrase2: new FormControl<string>('', [Validators.required]),
			fullPhrase3: new FormControl<string>('', [Validators.required]),
		}),
		triad4: new FormGroup({
			keyword: new FormControl<string>('', [Validators.required]),
			fullPhrase1: new FormControl<string>('', [Validators.required]),
			fullPhrase2: new FormControl<string>('', [Validators.required]),
			fullPhrase3: new FormControl<string>('', [Validators.required]),
		}),
	})

	private readonly validationService = new TriadValidationService()

	private readonly injector = inject(Injector)

	constructor() {
		effect(() => {
			const error = this.apiError()
			if (!error) {
				return
			}

			this.applyApiError(error)
		})

		this.formGroup.valueChanges.subscribe(() => {
			clearServerErrors(this.formGroup)

			if (this.serverErrors().length > 0) {
				this.serverErrors.set([])
			}

			if (this.formGroup.valid && this.clientValidationErrors().length > 0) {
				this.clientValidationErrors.set([])
			}
		})
	}

	onClose() {
		this.whenCanceled.emit()
	}

	onBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			this.onClose()
		}
	}

	onSubmit() {
		if (this.formGroup.invalid) {
			this.clientValidationErrors.set(['Please fill in all required fields'])
			this.scrollToErrors()
			return
		}

		const formValue = this.formGroup.value
		const formData: TriadGroupFormData = {
			difficulty: formValue.difficulty?.trim() || '',
			triad1: {
				keyword: formValue.triad1?.keyword?.trim() || '',
				fullPhrases: [
					formValue.triad1?.fullPhrase1?.trim() || '',
					formValue.triad1?.fullPhrase2?.trim() || '',
					formValue.triad1?.fullPhrase3?.trim() || '',
				],
			},
			triad2: {
				keyword: formValue.triad2?.keyword?.trim() || '',
				fullPhrases: [
					formValue.triad2?.fullPhrase1?.trim() || '',
					formValue.triad2?.fullPhrase2?.trim() || '',
					formValue.triad2?.fullPhrase3?.trim() || '',
				],
			},
			triad3: {
				keyword: formValue.triad3?.keyword?.trim() || '',
				fullPhrases: [
					formValue.triad3?.fullPhrase1?.trim() || '',
					formValue.triad3?.fullPhrase2?.trim() || '',
					formValue.triad3?.fullPhrase3?.trim() || '',
				],
			},
			triad4: {
				keyword: formValue.triad4?.keyword?.trim() || '',
				fullPhrases: [
					formValue.triad4?.fullPhrase1?.trim() || '',
					formValue.triad4?.fullPhrase2?.trim() || '',
					formValue.triad4?.fullPhrase3?.trim() || '',
				],
			},
		}

		const validation = this.validationService.validateTriadGroup(formData)
		if (!validation.valid) {
			this.clientValidationErrors.set(validation.errors)
			this.scrollToErrors()
			return
		}

		this.clientValidationErrors.set([])
		this.serverErrors.set([])
		this.whenCreated.emit(formData)
	}

	private applyApiError(error: ApiError): void {
		clearServerErrors(this.formGroup)

		if (error.isValidation) {
			applyFieldErrors(this.formGroup, error.fieldErrors, TRIAD_GROUP_FIELD_MAP)
			const bannerMessages = collectFieldErrorMessages(error.fieldErrors)
			this.serverErrors.set(bannerMessages.length > 0 ? bannerMessages : [error.userMessage])
		} else {
			this.serverErrors.set([error.userMessage])
		}

		this.scrollToErrors()
	}

	private scrollToErrors(): void {
		afterNextRender(
			() => {
				const errorBanner = this.errorBannerRef?.nativeElement
				if (errorBanner) {
					errorBanner.scrollIntoView({ behavior: 'smooth', block: 'start' })
					return
				}

				this.dialogRef?.scrollToTop()
			},
			{ injector: this.injector },
		)
	}

	get triad1Group() {
		return this.formGroup.get('triad1') as FormGroup
	}

	get triad2Group() {
		return this.formGroup.get('triad2') as FormGroup
	}

	get triad3Group() {
		return this.formGroup.get('triad3') as FormGroup
	}

	get triad4Group() {
		return this.formGroup.get('triad4') as FormGroup
	}
}
