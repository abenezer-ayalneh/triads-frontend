import { GamePlayState } from '../../pages/game-play/enums/game-play.enum'
import { SolvedTriad } from '../../pages/game-play/interfaces/triad.interface'
import { TurnAndHint } from '../../pages/game-play/interfaces/turn-and-hint.interface'
import { User } from './user.interface'

export interface GlobalState {
	user: User | null
	showHowToPlay: boolean
	cues: string[] | null
	isFetchingFinalTriadCues: boolean
	finalTriadCues: string[] | null
	selectedCues: string[]
	turns: TurnAndHint[]
	hints: TurnAndHint[]
	gamePlayState: GamePlayState
	triadsStep: 'INITIAL' | 'FINAL'
	keywordLengthHint: number | null
	firstLetterHint: string | null
	activeHintType: 'KEYWORD_LENGTH' | 'FIRST_LETTER' | null
	solvedTriads: SolvedTriad[]
	hintUsed: boolean
	gameScore: number
	cuesToExplode: string[]
}
