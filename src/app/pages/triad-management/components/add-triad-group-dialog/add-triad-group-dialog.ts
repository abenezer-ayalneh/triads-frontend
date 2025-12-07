import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'

import { AutoCapitalize } from '../../../../shared/directives/auto-capitalize'
import { TriadGroupFormData } from '../../interfaces/triad-group.interface'
import { TriadValidationService } from '../../services/triad-validation.service'

@Component({
	selector: 'app-add-triad-group-dialog',
	standalone: true,
	imports: [ReactiveFormsModule, AutoCapitalize],
	templateUrl: './add-triad-group-dialog.html',
	styleUrl: './add-triad-group-dialog.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTriadGroupDialog {
	whenCreated = output<TriadGroupFormData>()

	whenCanceled = output<void>()

	validationErrors = signal<string[]>([])

	formGroup = new FormGroup({
		triad1: new FormGroup({
			keyword: new FormControl<string>('', [Validators.required]),
			cue1: new FormControl<string>('', [Validators.required]),
			cue2: new FormControl<string>('', [Validators.required]),
			cue3: new FormControl<string>('', [Validators.required]),
		}),
		triad2: new FormGroup({
			keyword: new FormControl<string>('', [Validators.required]),
			cue1: new FormControl<string>('', [Validators.required]),
			cue2: new FormControl<string>('', [Validators.required]),
			cue3: new FormControl<string>('', [Validators.required]),
		}),
		triad3: new FormGroup({
			keyword: new FormControl<string>('', [Validators.required]),
			cue1: new FormControl<string>('', [Validators.required]),
			cue2: new FormControl<string>('', [Validators.required]),
			cue3: new FormControl<string>('', [Validators.required]),
		}),
		triad4: new FormGroup({
			keyword: new FormControl<string>('', [Validators.required]),
			cue1: new FormControl<string>('', [Validators.required]),
			cue2: new FormControl<string>('', [Validators.required]),
			cue3: new FormControl<string>('', [Validators.required]),
		}),
	})

	private readonly validationService = new TriadValidationService()

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
			this.validationErrors.set(['Please fill in all required fields'])
			return
		}

		const formValue = this.formGroup.value
		const formData: TriadGroupFormData = {
			triad1: {
				keyword: formValue.triad1?.keyword?.trim() || '',
				cues: [formValue.triad1?.cue1?.trim() || '', formValue.triad1?.cue2?.trim() || '', formValue.triad1?.cue3?.trim() || ''],
			},
			triad2: {
				keyword: formValue.triad2?.keyword?.trim() || '',
				cues: [formValue.triad2?.cue1?.trim() || '', formValue.triad2?.cue2?.trim() || '', formValue.triad2?.cue3?.trim() || ''],
			},
			triad3: {
				keyword: formValue.triad3?.keyword?.trim() || '',
				cues: [formValue.triad3?.cue1?.trim() || '', formValue.triad3?.cue2?.trim() || '', formValue.triad3?.cue3?.trim() || ''],
			},
			triad4: {
				keyword: formValue.triad4?.keyword?.trim() || '',
				cues: [formValue.triad4?.cue1?.trim() || '', formValue.triad4?.cue2?.trim() || '', formValue.triad4?.cue3?.trim() || ''],
			},
		}

		const validation = this.validationService.validateTriadGroup(formData)
		if (!validation.valid) {
			this.validationErrors.set(validation.errors)
			return
		}

		this.validationErrors.set([])
		this.whenCreated.emit(formData)
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
