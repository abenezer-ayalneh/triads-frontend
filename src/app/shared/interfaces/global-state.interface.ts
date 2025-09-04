import { GamePlayState } from '../../pages/game-play/enums/game-play.enum'
import { Triad } from '../../pages/game-play/interfaces/triad.interface'
import { TurnAndHint } from '../../pages/game-play/interfaces/turn-and-hint.interface'
import { User } from './user.interface'

export interface GlobalState {
	user: User | null
	showHowToPlay: boolean
	cues: string[] | null
	finalTriad: Triad | null
	selectedCues: string[]
	turns: TurnAndHint[]
	hints: TurnAndHint[]
	gamePlayState: GamePlayState
	triadsStep: 'INITIAL' | 'FOURTH'
}
