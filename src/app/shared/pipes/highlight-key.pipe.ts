import { Pipe, PipeTransform } from '@angular/core'

/**
 * Highlights a keyword from a sentence with a different color
 */
@Pipe({
	name: 'highlightKey',
})
export class HighlightKeyPipe implements PipeTransform {
	transform(phrase: string, keyword: string, extraClasses?: string): string {
		if (!keyword) return phrase

		const colorClassAttribute = extraClasses ? `${extraClasses}` : 'text-primary-content'

		const regex = new RegExp(`(${keyword})`, 'i') // Case-insensitive match
		return phrase.replace(regex, `<span class="font-semibold ${colorClassAttribute}">$1</span>`)
	}
}
