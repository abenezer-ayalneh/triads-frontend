import { Injectable } from '@angular/core'

import { TriadGroupFormData } from '../interfaces/triad-group.interface'

@Injectable({
	providedIn: 'root',
})
export class TriadValidationService {
	validateTriadGroup(data: TriadGroupFormData): { valid: boolean; errors: string[] } {
		const errors: string[] = []

		// Validate each triad has keyword and exactly 3 full phrases
		const triads = [
			{ name: 'Triad 1', triad: data.triad1 },
			{ name: 'Triad 2', triad: data.triad2 },
			{ name: 'Triad 3', triad: data.triad3 },
			{ name: 'Triad 4', triad: data.triad4 },
		]

		triads.forEach(({ name, triad }) => {
			// Check keyword exists
			if (!triad.keyword || triad.keyword.trim() === '') {
				errors.push(`${name}: Keyword is required`)
			}

			// Check exactly 3 full phrases exist
			if (!triad.fullPhrases || triad.fullPhrases.length !== 3) {
				errors.push(`${name}: Exactly 3 full phrases are required`)
			} else {
				// Check each full phrase is not empty
				triad.fullPhrases.forEach((fullPhrase, index) => {
					if (!fullPhrase || fullPhrase.trim() === '') {
						errors.push(`${name}: Word ${index + 1} is required`)
					}
				})

				// Check keyword is substring of each full phrase (case-insensitive)
				if (triad.keyword && triad.keyword.trim() !== '') {
					const keywordUpper = triad.keyword.trim().toUpperCase()
					triad.fullPhrases.forEach((fullPhrase, index) => {
						if (fullPhrase && fullPhrase.trim() !== '') {
							const fullPhraseUpper = fullPhrase.trim().toUpperCase()
							if (!fullPhraseUpper.includes(keywordUpper)) {
								errors.push(`${name}: Keyword "${triad.keyword}" must be a substring of Word ${index + 1} "${fullPhrase}"`)
							}
						}
					})
				}
			}
		})

		// Check keywords of triads 1-3 are substrings of full phrases in triad 4
		if (data.triad4.fullPhrases && data.triad4.fullPhrases.length === 3) {
			const triad4FullPhrases = data.triad4.fullPhrases.map((fullPhrase) => fullPhrase.trim())
			const keywords1to3 = [
				{ keyword: data.triad1.keyword?.trim() || '', name: 'Triad 1' },
				{ keyword: data.triad2.keyword?.trim() || '', name: 'Triad 2' },
				{ keyword: data.triad3.keyword?.trim() || '', name: 'Triad 3' },
			].filter((item) => item.keyword !== '')

			if (keywords1to3.length === 3 && triad4FullPhrases.every((fp) => fp !== '')) {
				// Check each keyword is a substring of exactly one full phrase
				const keywordMatches = new Map<string, number[]>()

				keywords1to3.forEach(({ keyword, name }) => {
					const keywordUpper = keyword.toUpperCase()
					const matchingPhraseIndices: number[] = []

					triad4FullPhrases.forEach((fullPhrase, phraseIndex) => {
						if (fullPhrase.toUpperCase().includes(keywordUpper)) {
							matchingPhraseIndices.push(phraseIndex)
						}
					})

					if (matchingPhraseIndices.length === 0) {
						errors.push(`Triad 4: Full phrases must contain "${keyword}" from ${name} as a substring`)
					} else if (matchingPhraseIndices.length > 1) {
						errors.push(
							`Triad 4: Keyword "${keyword}" from ${name} must be a substring of exactly one full phrase, but found in ${matchingPhraseIndices.length} phrases`,
						)
					} else {
						keywordMatches.set(keyword, matchingPhraseIndices)
					}
				})

				// Check each full phrase contains exactly one keyword
				if (errors.length === 0) {
					triad4FullPhrases.forEach((fullPhrase) => {
						const fullPhraseUpper = fullPhrase.toUpperCase()
						const matchingKeywords: string[] = []

						keywords1to3.forEach(({ keyword }) => {
							if (fullPhraseUpper.includes(keyword.toUpperCase())) {
								matchingKeywords.push(keyword)
							}
						})

						if (matchingKeywords.length === 0) {
							errors.push(`Triad 4: Full phrase "${fullPhrase}" must contain exactly one keyword from Triads 1-3 as a substring`)
						} else if (matchingKeywords.length > 1) {
							errors.push(
								`Triad 4: Full phrase "${fullPhrase}" contains multiple keywords (${matchingKeywords.join(', ')}). Each full phrase must contain exactly one keyword`,
							)
						}
					})
				}
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}
}
