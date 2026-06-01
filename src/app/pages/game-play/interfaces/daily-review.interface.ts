import { SolvedTriad } from './triad.interface'

export interface DailyReviewSummary {
	result: 'WON' | 'LOST'
	score: number
	puzzleDate: string | null
	nextPuzzleAt: string | null
	triads: SolvedTriad[]
}
