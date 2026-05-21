import { HttpErrorResponse } from '@angular/common/http'

export class ApiError extends Error {
	readonly statusCode: number

	readonly category: string

	readonly userMessage: string

	readonly fieldErrors: Map<string, string[]>

	readonly isValidation: boolean

	readonly originalResponse: HttpErrorResponse | null

	handled = false

	constructor(options: {
		userMessage: string
		statusCode: number
		category: string
		fieldErrors: Map<string, string[]>
		isValidation: boolean
		originalResponse: HttpErrorResponse | null
	}) {
		super(options.userMessage)
		this.name = 'ApiError'
		this.userMessage = options.userMessage
		this.statusCode = options.statusCode
		this.category = options.category
		this.fieldErrors = options.fieldErrors
		this.isValidation = options.isValidation
		this.originalResponse = options.originalResponse
	}

	markHandled(): void {
		this.handled = true
	}
}
