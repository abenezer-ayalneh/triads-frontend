import { Injectable } from '@angular/core'

import { TriadGroupFormData } from '../interfaces/triad-group.interface'

@Injectable({
	providedIn: 'root',
})
export class TriadValidationService {
	validateTriadGroup(data: TriadGroupFormData): { valid: boolean; errors: string[] } {
		const errors: string[] = []

		// Validate each triad has keyword and exactly 3 cues
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

			// Check exactly 3 cues exist
			if (!triad.cues || triad.cues.length !== 3) {
				errors.push(`${name}: Exactly 3 cues are required`)
			} else {
				// Check each cue is not empty
				triad.cues.forEach((cue, index) => {
					if (!cue || cue.trim() === '') {
						errors.push(`${name}: Cue ${index + 1} is required`)
					}
				})

				// Check keyword is substring of each cue (case-insensitive)
				if (triad.keyword && triad.keyword.trim() !== '') {
					const keywordUpper = triad.keyword.trim().toUpperCase()
					triad.cues.forEach((cue, index) => {
						if (cue && cue.trim() !== '') {
							const cueUpper = cue.trim().toUpperCase()
							if (!cueUpper.includes(keywordUpper)) {
								errors.push(`${name}: Keyword "${triad.keyword}" must be a substring of Cue ${index + 1} "${cue}"`)
							}
						}
					})
				}
			}
		})

		// Check keywords of triads 1-3 exactly match cues of triad 4
		if (data.triad4.cues && data.triad4.cues.length === 3) {
			const triad4Cues = data.triad4.cues.map((cue) => cue.trim().toUpperCase()).filter((cue) => cue !== '')
			const keywords1to3 = [
				data.triad1.keyword?.trim().toUpperCase(),
				data.triad2.keyword?.trim().toUpperCase(),
				data.triad3.keyword?.trim().toUpperCase(),
			].filter((keyword) => keyword && keyword !== '')

			if (keywords1to3.length === 3) {
				// Check if all three keywords are present in triad 4 cues (exact match)
				const missingKeywords: string[] = []
				keywords1to3.forEach((keyword) => {
					if (!triad4Cues.includes(keyword)) {
						missingKeywords.push(keyword)
					}
				})

				if (missingKeywords.length > 0) {
					errors.push(`Triad 4: Cues must contain exactly the keywords from Triads 1-3. Missing: ${missingKeywords.join(', ')}`)
				}

				// Check if triad 4 has exactly these three keywords (no extra cues)
				if (triad4Cues.length !== 3) {
					errors.push(`Triad 4: Must have exactly 3 cues matching the keywords from Triads 1-3`)
				}
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}
}
