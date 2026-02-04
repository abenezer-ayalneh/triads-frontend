import { ChangeDetectionStrategy, Component, effect, ElementRef, input, output, signal, ViewChild } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'

import { Dialog } from '../../../../shared/components/dialog/dialog'
import { AutoCapitalize } from '../../../../shared/directives/auto-capitalize'
import { Difficulty } from '../../../../shared/enums/difficulty.enum'
import { TriadGroup, TriadGroupFormData } from '../../interfaces/triad-group.interface'
import { TriadValidationService } from '../../services/triad-validation.service'

@Component({
	selector: 'app-edit-triad-group-dialog',
	standalone: true,
	imports: [ReactiveFormsModule, AutoCapitalize, Dialog],
	templateUrl: './edit-triad-group-dialog.html',
	styleUrl: './edit-triad-group-dialog.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditTriadGroupDialog {
	triadGroup = input.required<TriadGroup>()

	whenSaved = output<TriadGroupFormData>()

	whenCanceled = output<void>()

	validationErrors = signal<string[]>([])

	readonly Difficulty = Difficulty

	@ViewChild('dialogBody', { static: false }) dialogBodyRef?: ElementRef<HTMLDivElement>

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

	constructor() {
		effect(() => {
			const group = this.triadGroup()
			if (group) {
				this.populateForm(group)
			}
		})

		// Clear validation errors when form becomes valid after user fixes issues
		this.formGroup.valueChanges.subscribe(() => {
			if (this.formGroup.valid && this.validationErrors().length > 0) {
				this.validationErrors.set([])
			}
		})
	}

	private populateForm(group: TriadGroup) {
		this.formGroup.patchValue({
			difficulty: group.difficulty,
			triad1: {
				keyword: group.triad1.keyword,
				fullPhrase1: group.triad1.fullPhrases[0],
				fullPhrase2: group.triad1.fullPhrases[1],
				fullPhrase3: group.triad1.fullPhrases[2],
			},
			triad2: {
				keyword: group.triad2.keyword,
				fullPhrase1: group.triad2.fullPhrases[0],
				fullPhrase2: group.triad2.fullPhrases[1],
				fullPhrase3: group.triad2.fullPhrases[2],
			},
			triad3: {
				keyword: group.triad3.keyword,
				fullPhrase1: group.triad3.fullPhrases[0],
				fullPhrase2: group.triad3.fullPhrases[1],
				fullPhrase3: group.triad3.fullPhrases[2],
			},
			triad4: {
				keyword: group.triad4.keyword,
				fullPhrase1: group.triad4.fullPhrases[0],
				fullPhrase2: group.triad4.fullPhrases[1],
				fullPhrase3: group.triad4.fullPhrases[2],
			},
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
			this.validationErrors.set(['Please fill in all required fields'])
			this.scrollToTop()
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
			this.validationErrors.set(validation.errors)
			this.scrollToTop()
			return
		}

		this.validationErrors.set([])
		this.whenSaved.emit(formData)
	}

	private scrollToTop() {
		// Use setTimeout to ensure the DOM has updated with the error messages
		setTimeout(() => {
			this.dialogBodyRef?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' })
		}, 0)
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
