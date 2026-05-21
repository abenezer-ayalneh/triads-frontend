import { HttpErrorResponse } from '@angular/common/http'
import { FormControl, FormGroup } from '@angular/forms'

import { ApiError } from './api-error.model'
import { applyFieldErrors, collectFieldErrorMessages, getControlErrorMessage, hasValidatorErrors, parseApiError, TRIAD_GROUP_FIELD_MAP } from './api-error.util'

describe('api-error.util', () => {
	it('should parse HttpException message from nested data object', () => {
		const response = new HttpErrorResponse({
			status: 404,
			error: {
				statusCode: 404,
				error: 'HTTP Error',
				data: {
					statusCode: 404,
					message: 'Triad group not found',
					error: 'Not Found',
				},
			},
		})

		const apiError = parseApiError(response)

		expect(apiError.userMessage).toBe('Triad group not found')
		expect(apiError.statusCode).toBe(404)
		expect(apiError.isValidation).toBeFalse()
	})

	it('should parse validation errors into fieldErrors map', () => {
		const response = new HttpErrorResponse({
			status: 422,
			error: {
				statusCode: 422,
				error: 'Validation Error',
				data: [
					{
						field: 'triad1.keyword',
						errors: { isNotEmpty: 'keyword should not be empty' },
					},
				],
			},
		})

		const apiError = parseApiError(response)

		expect(apiError.isValidation).toBeTrue()
		expect(apiError.fieldErrors.get('triad1.keyword')).toEqual(['keyword should not be empty'])
		expect(apiError.userMessage).toBe('keyword should not be empty')
	})

	it('should mask server errors with a generic message', () => {
		const response = new HttpErrorResponse({
			status: 500,
			error: {
				statusCode: 500,
				error: 'Server Error',
				data: 'Internal server error',
			},
		})

		const apiError = parseApiError(response)

		expect(apiError.userMessage).toBe('Something went wrong. Please try again.')
	})

	it('should parse network errors', () => {
		const response = new HttpErrorResponse({
			error: new ProgressEvent('error'),
			status: 0,
		})

		const apiError = parseApiError(response)

		expect(apiError.userMessage).toBe('Check your connection and try again.')
		expect(apiError.category).toBe('Network Error')
	})

	it('should apply field errors to mapped form controls', () => {
		const form = new FormGroup({
			triad1: new FormGroup({
				keyword: new FormControl(''),
				fullPhrase1: new FormControl(''),
				fullPhrase2: new FormControl(''),
				fullPhrase3: new FormControl(''),
			}),
		})

		applyFieldErrors(form, new Map([['triad1.fullPhrases.0', ['fullPhrases must contain 3 items']]]), TRIAD_GROUP_FIELD_MAP)

		expect(form.get('triad1.fullPhrase1')?.errors?.['server']).toBe('fullPhrases must contain 3 items')
		expect(form.get('triad1.fullPhrase2')?.errors?.['server']).toBe('fullPhrases must contain 3 items')
		expect(form.get('triad1.fullPhrase3')?.errors?.['server']).toBe('fullPhrases must contain 3 items')
	})

	it('should expose server error messages from dirty controls only', () => {
		const control = new FormControl('')
		control.setErrors({ server: 'Invalid answer' })

		expect(getControlErrorMessage(control)).toBeNull()

		control.markAsDirty()

		expect(getControlErrorMessage(control)).toBe('Invalid answer')
	})

	it('should hide required errors until the control is dirty', () => {
		const control = new FormControl('', { validators: [(c) => (c.value ? null : { required: true })] })

		expect(getControlErrorMessage(control)).toBeNull()

		control.markAsDirty()

		expect(getControlErrorMessage(control)).toBe('This field is required')
	})

	it('should ignore server errors when checking validator-only form validity', () => {
		const form = new FormGroup({
			keyword: new FormControl('valid'),
		})

		form.get('keyword')?.setErrors({ server: 'Backend rejected keyword' })

		expect(form.invalid).toBeTrue()
		expect(hasValidatorErrors(form)).toBeFalse()
	})

	it('should collect unique validation banner messages', () => {
		const messages = collectFieldErrorMessages(
			new Map([
				['triad1.keyword', ['keyword should not be empty']],
				['triad2.keyword', ['keyword should not be empty', 'must be uppercase']],
			]),
		)

		expect(messages).toEqual(['keyword should not be empty', 'must be uppercase'])
	})

	it('should preserve ApiError instances', () => {
		const original = new ApiError({
			userMessage: 'Already parsed',
			statusCode: 400,
			category: 'HTTP Error',
			fieldErrors: new Map(),
			isValidation: false,
			originalResponse: null,
		})

		expect(parseApiError(original)).toBe(original)
	})
})
