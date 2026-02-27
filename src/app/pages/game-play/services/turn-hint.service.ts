import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'

import { TurnAndHint } from '../interfaces/turn-and-hint.interface'

type HintExtra = 'KEYWORD_LENGTH' | 'FIRST_LETTER'

type HintOutcome = 'CORRECT' | 'FAIL'

@Injectable({
	providedIn: 'root',
})
export class TurnHintService {
	private readonly httpClient = inject(HttpClient)

	numberOfAvailableTurns(turns: TurnAndHint[]) {
		return turns.filter((turn) => turn.available).length
	}

	numberOfAvailableHints(hints: TurnAndHint[]) {
		return hints.filter((hint) => hint.available).length
	}

	/**
	 * Returns whether a hint can be used in the current (T, H) state.
	 *
	 * Based on the target table:
	 * - Hints are allowed for (3,2), (2,2), (2,1), (1,2), (1,1)
	 * - Hints are not allowed for (1,0) or when there are no hints/turns left.
	 */
	canUseHint(turns: TurnAndHint[], hints: TurnAndHint[]) {
		const availableTurns = this.numberOfAvailableTurns(turns)
		const availableHints = this.numberOfAvailableHints(hints)

		if (availableTurns <= 0 || availableHints <= 0) {
			return false
		}

		// (1,0) – no hints allowed
		if (availableTurns === 1 && availableHints === 0) {
			return false
		}

		return true
	}

	/**
	 * Consume a single hint token without changing turns.
	 *
	 * This aligns with the table where using a hint always reduces H by 1,
	 * while the turn cost is decided later when we know whether the attempt
	 * was correct or failed.
	 */
	useHintToken(hints: TurnAndHint[]) {
		const updatedHints = hints.map((hint) => ({ ...hint }))

		let currentHintIndex = -1
		updatedHints.forEach((hint, index) => {
			if (hint.available) {
				currentHintIndex = index
			}
		})

		if (currentHintIndex === -1) {
			throw new Error('No available hints to use')
		}

		updatedHints[currentHintIndex].available = false
		return updatedHints
	}

	/**
	 * Apply an organic fail (no hint used) according to the table.
	 *
	 * Generic rule from the table:
	 * - If T > 1: T -> T - 1, H unchanged, game continues.
	 * - If T === 1: game ends, T -> 0, H unchanged.
	 */
	applyOrganicFail(turns: TurnAndHint[], hints: TurnAndHint[]) {
		const currentTurns = this.numberOfAvailableTurns(turns)

		if (currentTurns <= 0) {
			return { turns, hints, gameEnds: true }
		}

		if (currentTurns > 1) {
			const updatedTurns = this.setAvailableTurns(turns, currentTurns - 1)
			return { turns: updatedTurns, hints, gameEnds: false }
		}

		// currentTurns === 1 -> game ends
		const updatedTurns = this.setAvailableTurns(turns, 0)
		return { turns: updatedTurns, hints, gameEnds: true }
	}

	/**
	 * Apply the outcome of an attempt where a hint was used (Hint + Correct / Hint + Fail).
	 *
	 * After using a hint token, only the turn count changes depending on the outcome:
	 *
	 * From the table (after consuming the hint token):
	 * - For T >= 2: both Hint+Correct and Hint+Fail behave as T -> T - 1, H unchanged.
	 * - For T === 1:
	 *   - Hint+Correct: game continues, T and H unchanged.
	 *   - Hint+Fail: game ends, T -> 0, H unchanged.
	 */
	applyHintOutcome(turns: TurnAndHint[], hints: TurnAndHint[], outcome: HintOutcome) {
		const currentTurns = this.numberOfAvailableTurns(turns)

		if (currentTurns <= 0) {
			return { turns, hints, gameEnds: true }
		}

		if (currentTurns >= 2) {
			const updatedTurns = this.setAvailableTurns(turns, currentTurns - 1)
			return { turns: updatedTurns, hints, gameEnds: false }
		}

		// currentTurns === 1
		if (outcome === 'CORRECT') {
			// (1,2) -> (1,1), (1,1) -> (1,0): in both cases we already consumed the hint token,
			// so the remaining state is correct without changing turns here.
			return { turns, hints, gameEnds: false }
		}

		// outcome === 'FAIL' with one turn -> game ends
		const updatedTurns = this.setAvailableTurns(turns, 0)
		return { turns: updatedTurns, hints, gameEnds: true }
	}

	getHint(cues: string[], hintExtra?: HintExtra) {
		const params: { cues: string[]; with?: HintExtra } = { cues }

		if (hintExtra !== undefined) {
			params.with = hintExtra
		}

		return this.httpClient.get<{ hint: string[] | null; with?: string; withValue?: string }>('triads/hint', { params })
	}

	private setAvailableTurns(turns: TurnAndHint[], targetAvailable: number) {
		const updatedTurns = turns.map((turn) => ({ ...turn }))

		// Ensure a stable order: keep the first `targetAvailable` as available, the rest unavailable.
		let remaining = targetAvailable
		for (const turn of updatedTurns) {
			if (remaining > 0) {
				turn.available = true
				remaining -= 1
			} else {
				turn.available = false
			}
		}

		return updatedTurns
	}
}
