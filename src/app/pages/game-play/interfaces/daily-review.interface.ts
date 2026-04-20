import { SolvedTriad } from './triad.interface'

export interface DailyReviewSummary {
	result: 'WON' | 'LOST'
	score: number
	nextPuzzleAt: string | null
	triads: SolvedTriad[]
}
