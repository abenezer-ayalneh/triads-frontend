import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { TurnAndHint } from '../interfaces/turn-and-hint.interface'
import { TurnHintService } from './turn-hint.service'

describe('TurnHintService (turns & hints table)', () => {
	let service: TurnHintService

	const createTurns = (available: number): TurnAndHint[] => {
		const totalTurns = 3
		return Array.from({ length: totalTurns }, (_, index) => ({
			id: index + 1,
			available: index < available,
			icon: `turn-${index + 1}`,
		}))
	}

	const createHints = (available: number): TurnAndHint[] => {
		const totalHints = 2
		return Array.from({ length: totalHints }, (_, index) => ({
			id: index + 1,
			available: index < available,
		}))
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
		})
		service = TestBed.inject(TurnHintService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})

	describe('canUseHint (Hint allowed? column)', () => {
		it('matches the table for all (T, H) combinations', () => {
			const cases = [
				// T, H, expected canUseHint
				{ turns: 3, hints: 2, canUseHint: true }, // (3,2)
				{ turns: 2, hints: 2, canUseHint: true }, // (2,2)
				{ turns: 2, hints: 1, canUseHint: true }, // (2,1)
				{ turns: 1, hints: 2, canUseHint: true }, // (1,2)
				{ turns: 1, hints: 1, canUseHint: true }, // (1,1)
				{ turns: 1, hints: 0, canUseHint: false }, // (1,0)
				{ turns: 0, hints: 2, canUseHint: false }, // no turns left
				{ turns: 0, hints: 0, canUseHint: false }, // no turns / hints
			]

			for (const { turns, hints, canUseHint } of cases) {
				const turnArray = createTurns(turns)
				const hintArray = createHints(hints)
				expect(service.canUseHint(turnArray, hintArray)).withContext(`(T=${turns}, H=${hints})`).toBe(canUseHint)
			}
		})
	})

	describe('Organic fail (no hint used)', () => {
		it('matches the table for all relevant (T, H) states', () => {
			const cases = [
				// startT, startH, endT, endH, gameEnds
				{ startT: 3, startH: 2, endT: 2, endH: 2, gameEnds: false }, // (3,2) -> (2,2)
				{ startT: 2, startH: 2, endT: 1, endH: 2, gameEnds: false }, // (2,2) -> (1,2)
				{ startT: 2, startH: 1, endT: 1, endH: 1, gameEnds: false }, // (2,1) -> (1,1)
				{ startT: 1, startH: 2, endT: 0, endH: 2, gameEnds: true }, // (1,2) -> game ends
				{ startT: 1, startH: 1, endT: 0, endH: 1, gameEnds: true }, // (1,1) -> game ends
				{ startT: 1, startH: 0, endT: 0, endH: 0, gameEnds: true }, // (1,0) -> game ends
			]

			for (const { startT, startH, endT, endH, gameEnds } of cases) {
				const turns = createTurns(startT)
				const hints = createHints(startH)

				const result = service.applyFailure(turns, hints)

				expect(service.numberOfAvailableTurns(result.turns)).withContext(`Organic fail turns from (T=${startT}, H=${startH})`).toBe(endT)
				expect(service.numberOfAvailableHints(result.hints)).withContext(`Organic fail hints from (T=${startT}, H=${startH})`).toBe(endH)
				expect(result.gameEnds).withContext(`Organic fail gameEnds from (T=${startT}, H=${startH})`).toBe(gameEnds)
			}
		})
	})

	describe('Hint + Correct and Hint + Fail', () => {
		const runHintFlow = (startT: number, startH: number, outcome: 'CORRECT' | 'FAIL'): { endT: number; endH: number; gameEnds: boolean } => {
			const turns = createTurns(startT)
			const hints = createHints(startH)

			// Using a hint first always consumes one hint token
			const hintsAfterUse = service.useHintToken(hints)

			const { turns: finalTurns, hints: finalHints, gameEnds } = service.applyHintOutcome(turns, hintsAfterUse, outcome)

			return {
				endT: service.numberOfAvailableTurns(finalTurns),
				endH: service.numberOfAvailableHints(finalHints),
				gameEnds,
			}
		}

		it('matches the table for all (T, H) with Hint + Correct', () => {
			const cases = [
				// startT, startH, endT, endH, gameEnds
				{ startT: 3, startH: 2, endT: 2, endH: 1, gameEnds: false }, // (3,2) -> (2,1)
				{ startT: 2, startH: 2, endT: 1, endH: 1, gameEnds: false }, // (2,2) -> (1,1)
				{ startT: 2, startH: 1, endT: 1, endH: 0, gameEnds: false }, // (2,1) -> (1,0)
				{ startT: 1, startH: 2, endT: 1, endH: 1, gameEnds: false }, // (1,2) -> (1,1)
				{ startT: 1, startH: 1, endT: 1, endH: 0, gameEnds: false }, // (1,1) -> (1,0)
			]

			for (const { startT, startH, endT, endH, gameEnds } of cases) {
				const result = runHintFlow(startT, startH, 'CORRECT')

				expect(result.endT).withContext(`Hint + Correct turns from (T=${startT}, H=${startH})`).toBe(endT)
				expect(result.endH).withContext(`Hint + Correct hints from (T=${startT}, H=${startH})`).toBe(endH)
				expect(result.gameEnds).withContext(`Hint + Correct gameEnds from (T=${startT}, H=${startH})`).toBe(gameEnds)
			}
		})

		it('matches the table for all (T, H) with Hint + Fail', () => {
			const cases = [
				// startT, startH, endT, endH, gameEnds
				{ startT: 3, startH: 2, endT: 2, endH: 1, gameEnds: false }, // (3,2) -> (2,1)
				{ startT: 2, startH: 2, endT: 1, endH: 1, gameEnds: false }, // (2,2) -> (1,1)
				{ startT: 2, startH: 1, endT: 1, endH: 0, gameEnds: false }, // (2,1) -> (1,0)
				{ startT: 1, startH: 2, endT: 0, endH: 1, gameEnds: true }, // (1,2) -> game ends
				{ startT: 1, startH: 1, endT: 0, endH: 0, gameEnds: true }, // (1,1) -> game ends
			]

			for (const { startT, startH, endT, endH, gameEnds } of cases) {
				const result = runHintFlow(startT, startH, 'FAIL')

				expect(result.endT).withContext(`Hint + Fail turns from (T=${startT}, H=${startH})`).toBe(endT)
				expect(result.endH).withContext(`Hint + Fail hints from (T=${startT}, H=${startH})`).toBe(endH)
				expect(result.gameEnds).withContext(`Hint + Fail gameEnds from (T=${startT}, H=${startH})`).toBe(gameEnds)
			}
		})

		it('(1,0) Hint + Correct/Fail are not possible: useHintToken throws when no hints available', () => {
			const turns = createTurns(1)
			const hints = createHints(0)

			expect(service.canUseHint(turns, hints)).toBe(false)
			expect(() => service.useHintToken(hints)).toThrowError('No available hints to use')
		})
	})

	describe('Full state transition table (screenshot spec)', () => {
		const runHintFlow = (startT: number, startH: number, outcome: 'CORRECT' | 'FAIL') => {
			const turns = createTurns(startT)
			const hints = createHints(startH)
			const hintsAfterUse = service.useHintToken(hints)
			const { turns: finalTurns, hints: finalHints, gameEnds } = service.applyHintOutcome(turns, hintsAfterUse, outcome)
			return {
				endT: service.numberOfAvailableTurns(finalTurns),
				endH: service.numberOfAvailableHints(finalHints),
				gameEnds,
			}
		}

		it('every (T,H) row: Organic Fail, Hint+Correct, Hint+Fail match the table', () => {
			const table: {
				startT: number
				startH: number
				hintAllowed: boolean
				organicFail: { endT: number; endH: number; gameEnds: boolean }
				hintCorrect: { endT: number; endH: number; gameEnds: boolean } | null
				hintFail: { endT: number; endH: number; gameEnds: boolean } | null
			}[] = [
				{
					startT: 3,
					startH: 2,
					hintAllowed: true,
					organicFail: { endT: 2, endH: 2, gameEnds: false },
					hintCorrect: { endT: 2, endH: 1, gameEnds: false },
					hintFail: { endT: 2, endH: 1, gameEnds: false },
				},
				{
					startT: 2,
					startH: 2,
					hintAllowed: true,
					organicFail: { endT: 1, endH: 2, gameEnds: false },
					hintCorrect: { endT: 1, endH: 1, gameEnds: false },
					hintFail: { endT: 1, endH: 1, gameEnds: false },
				},
				{
					startT: 2,
					startH: 1,
					hintAllowed: true,
					organicFail: { endT: 1, endH: 1, gameEnds: false },
					hintCorrect: { endT: 1, endH: 0, gameEnds: false },
					hintFail: { endT: 1, endH: 0, gameEnds: false },
				},
				{
					startT: 1,
					startH: 2,
					hintAllowed: true,
					organicFail: { endT: 0, endH: 2, gameEnds: true },
					hintCorrect: { endT: 1, endH: 1, gameEnds: false },
					hintFail: { endT: 0, endH: 1, gameEnds: true },
				},
				{
					startT: 1,
					startH: 1,
					hintAllowed: true,
					organicFail: { endT: 0, endH: 1, gameEnds: true },
					hintCorrect: { endT: 1, endH: 0, gameEnds: false },
					hintFail: { endT: 0, endH: 0, gameEnds: true },
				},
				{ startT: 1, startH: 0, hintAllowed: false, organicFail: { endT: 0, endH: 0, gameEnds: true }, hintCorrect: null, hintFail: null },
			]

			for (const row of table) {
				const turns = createTurns(row.startT)
				const hints = createHints(row.startH)

				expect(service.canUseHint(turns, hints)).withContext(`(T=${row.startT}, H=${row.startH}) hint allowed`).toBe(row.hintAllowed)

				const organic = service.applyFailure(turns, hints)
				expect(service.numberOfAvailableTurns(organic.turns))
					.withContext(`(T=${row.startT}, H=${row.startH}) organic fail -> T`)
					.toBe(row.organicFail.endT)
				expect(service.numberOfAvailableHints(organic.hints))
					.withContext(`(T=${row.startT}, H=${row.startH}) organic fail -> H`)
					.toBe(row.organicFail.endH)
				expect(organic.gameEnds).withContext(`(T=${row.startT}, H=${row.startH}) organic fail -> gameEnds`).toBe(row.organicFail.gameEnds)

				if (row.hintCorrect !== null) {
					const result = runHintFlow(row.startT, row.startH, 'CORRECT')
					expect(result.endT).withContext(`(T=${row.startT}, H=${row.startH}) hint+correct -> T`).toBe(row.hintCorrect.endT)
					expect(result.endH).withContext(`(T=${row.startT}, H=${row.startH}) hint+correct -> H`).toBe(row.hintCorrect.endH)
					expect(result.gameEnds).withContext(`(T=${row.startT}, H=${row.startH}) hint+correct -> gameEnds`).toBe(row.hintCorrect.gameEnds)
				}
				if (row.hintFail !== null) {
					const result = runHintFlow(row.startT, row.startH, 'FAIL')
					expect(result.endT).withContext(`(T=${row.startT}, H=${row.startH}) hint+fail -> T`).toBe(row.hintFail.endT)
					expect(result.endH).withContext(`(T=${row.startT}, H=${row.startH}) hint+fail -> H`).toBe(row.hintFail.endH)
					expect(result.gameEnds).withContext(`(T=${row.startT}, H=${row.startH}) hint+fail -> gameEnds`).toBe(row.hintFail.gameEnds)
				}
			}
		})
	})
})
