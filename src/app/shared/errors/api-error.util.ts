import { HttpErrorResponse } from '@angular/common/http'
import { AbstractControl, FormGroup } from '@angular/forms'

import FilterResponseInterface, { HttpExceptionData, ValidationErrorItem } from '../interfaces/error-response.interface'
import { ApiError } from './api-error.model'

const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again.'
const GENERIC_FALLBACK_MESSAGE = 'Unexpected error occurred. Please try again.'
const NETWORK_ERROR_MESSAGE = 'Check your connection and try again.'

function isValidationErrorItem(value: unknown): value is ValidationErrorItem {
	if (!value || typeof value !== 'object') {
		return false
	}

	const item = value as ValidationErrorItem
	return typeof item.field === 'string'
}

function isValidationErrorArray(data: unknown): data is ValidationErrorItem[] {
	return Array.isArray(data) && data.every(isValidationErrorItem)
}

function isHttpExceptionData(data: unknown): data is HttpExceptionData {
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return false
	}

	const item = data as HttpExceptionData
	return 'message' in item
}

function constraintMessages(errors: Record<string, string> | undefined): string[] {
	if (!errors) {
		return []
	}

	return Object.values(errors).filter((message) => typeof message === 'string' && message.length > 0)
}

function parseFieldErrors(data: ValidationErrorItem[]): Map<string, string[]> {
	const fieldErrors = new Map<string, string[]>()

	for (const item of data) {
		const messages = constraintMessages(item.errors)
		if (messages.length > 0) {
			fieldErrors.set(item.field, messages)
		}
	}

	return fieldErrors
}

function firstValidationMessage(fieldErrors: Map<string, string[]>): string | null {
	for (const messages of fieldErrors.values()) {
		if (messages.length > 0) {
			return messages[0]
		}
	}

	return null
}

function isServerSideFailure(statusCode: number, category: string): boolean {
	return statusCode >= 500 || category === 'Server Error' || category === 'Database Error'
}

function parseHttpExceptionMessage(data: HttpExceptionData): string | null {
	const { message } = data

	if (typeof message === 'string' && message.length > 0) {
		return message
	}

	if (Array.isArray(message)) {
		const firstMessage = message.find((value) => typeof value === 'string' && value.length > 0)
		return firstMessage ?? null
	}

	return null
}

function parseFilterResponse(
	body: unknown,
	statusCode: number,
): {
	userMessage: string
	category: string
	fieldErrors: Map<string, string[]>
	isValidation: boolean
} {
	const fallbackCategory = 'HTTP Error'
	const response = (body ?? {}) as Partial<FilterResponseInterface>
	const category = typeof response.error === 'string' ? response.error : fallbackCategory
	const resolvedStatusCode = typeof response.statusCode === 'number' ? response.statusCode : statusCode
	const fieldErrors = isValidationErrorArray(response.data) ? parseFieldErrors(response.data) : new Map<string, string[]>()
	const isValidation = category === 'Validation Error' || fieldErrors.size > 0

	if (isServerSideFailure(resolvedStatusCode, category)) {
		return {
			userMessage: GENERIC_SERVER_MESSAGE,
			category,
			fieldErrors,
			isValidation,
		}
	}

	if (isValidation) {
		return {
			userMessage: firstValidationMessage(fieldErrors) ?? category,
			category,
			fieldErrors,
			isValidation: true,
		}
	}

	if (isHttpExceptionData(response.data)) {
		const message = parseHttpExceptionMessage(response.data)
		if (message) {
			return {
				userMessage: message,
				category,
				fieldErrors,
				isValidation: false,
			}
		}
	}

	if (typeof response.data === 'string' && response.data.length > 0 && !isServerSideFailure(resolvedStatusCode, category)) {
		return {
			userMessage: response.data,
			category,
			fieldErrors,
			isValidation: false,
		}
	}

	if (category && category !== fallbackCategory) {
		return {
			userMessage: category,
			category,
			fieldErrors,
			isValidation: false,
		}
	}

	return {
		userMessage: GENERIC_FALLBACK_MESSAGE,
		category,
		fieldErrors,
		isValidation: false,
	}
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError
}

export function parseApiError(caughtError: unknown): ApiError {
	if (caughtError instanceof ApiError) {
		return caughtError
	}

	if (caughtError instanceof HttpErrorResponse) {
		if (caughtError.error instanceof ProgressEvent && caughtError.error.type === 'error') {
			return new ApiError({
				userMessage: NETWORK_ERROR_MESSAGE,
				statusCode: 0,
				category: 'Network Error',
				fieldErrors: new Map(),
				isValidation: false,
				originalResponse: caughtError,
			})
		}

		const parsed = parseFilterResponse(caughtError.error, caughtError.status)
		const body = (caughtError.error ?? {}) as Partial<FilterResponseInterface>

		return new ApiError({
			userMessage: parsed.userMessage,
			statusCode: typeof body.statusCode === 'number' ? body.statusCode : caughtError.status,
			category: parsed.category,
			fieldErrors: parsed.fieldErrors,
			isValidation: parsed.isValidation,
			originalResponse: caughtError,
		})
	}

	return new ApiError({
		userMessage: GENERIC_FALLBACK_MESSAGE,
		statusCode: 0,
		category: 'Client Error',
		fieldErrors: new Map(),
		isValidation: false,
		originalResponse: null,
	})
}

function normalizeBackendField(field: string): string {
	return field.replace(/\.\d+$/, '')
}

function resolveControlPath(form: FormGroup, backendField: string, fieldMap?: Record<string, string | string[]>): string[] {
	const normalizedField = normalizeBackendField(backendField)

	if (fieldMap?.[normalizedField]) {
		const mapped = fieldMap[normalizedField]
		return Array.isArray(mapped) ? mapped : [mapped]
	}

	return [normalizedField]
}

function getControl(form: FormGroup, path: string): AbstractControl | null {
	return form.get(path)
}

function setServerError(control: AbstractControl, message: string): void {
	const currentErrors = control.errors ?? {}
	control.setErrors({ ...currentErrors, server: message })
	control.markAsDirty()
}

export function applyFieldErrors(form: FormGroup, fieldErrors: Map<string, string[]>, fieldMap?: Record<string, string | string[]>): void {
	for (const [backendField, messages] of fieldErrors.entries()) {
		const message = messages[0]
		if (!message) {
			continue
		}

		for (const controlPath of resolveControlPath(form, backendField, fieldMap)) {
			const control = getControl(form, controlPath)
			if (control) {
				setServerError(control, message)
			}
		}
	}
}

export function clearServerErrors(form: FormGroup): void {
	for (const control of Object.values(form.controls)) {
		if (control instanceof FormGroup) {
			clearServerErrors(control)
			continue
		}

		if (!control.errors?.['server']) {
			continue
		}

		const remainingErrors = { ...control.errors }
		delete remainingErrors['server']
		control.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null)
	}
}

export function getControlErrorMessage(control: AbstractControl | null): string | null {
	if (!control?.errors || !control.dirty) {
		return null
	}

	if (typeof control.errors['server'] === 'string') {
		return control.errors['server']
	}

	if (control.errors['required']) {
		return 'This field is required'
	}

	return null
}

export function hasValidatorErrors(control: AbstractControl): boolean {
	if (control instanceof FormGroup) {
		return Object.values(control.controls).some((child) => hasValidatorErrors(child))
	}

	if (!control.errors) {
		return false
	}

	return Object.keys(control.errors).some((key) => key !== 'server')
}

export function collectFieldErrorMessages(fieldErrors: Map<string, string[]>): string[] {
	const messages: string[] = []

	for (const fieldMessages of fieldErrors.values()) {
		for (const message of fieldMessages) {
			if (!messages.includes(message)) {
				messages.push(message)
			}
		}
	}

	return messages
}

export const TRIAD_GROUP_FIELD_MAP: Record<string, string | string[]> = {
	difficulty: 'difficulty',
	'triad1.keyword': 'triad1.keyword',
	'triad1.fullPhrases': ['triad1.fullPhrase1', 'triad1.fullPhrase2', 'triad1.fullPhrase3'],
	'triad2.keyword': 'triad2.keyword',
	'triad2.fullPhrases': ['triad2.fullPhrase1', 'triad2.fullPhrase2', 'triad2.fullPhrase3'],
	'triad3.keyword': 'triad3.keyword',
	'triad3.fullPhrases': ['triad3.fullPhrase1', 'triad3.fullPhrase2', 'triad3.fullPhrase3'],
	'triad4.keyword': 'triad4.keyword',
	'triad4.fullPhrases': ['triad4.fullPhrase1', 'triad4.fullPhrase2', 'triad4.fullPhrase3'],
}
