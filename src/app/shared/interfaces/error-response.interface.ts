export interface ValidationErrorItem {
	field: string
	errors: Record<string, string> | undefined
}

export interface HttpExceptionData {
	statusCode: number
	message: string | string[]
	error: string
}

export default interface FilterResponseInterface {
	statusCode: number
	error: string
	data: string | ValidationErrorItem[] | HttpExceptionData
}
