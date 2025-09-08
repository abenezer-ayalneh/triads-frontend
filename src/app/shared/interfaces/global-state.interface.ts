import { GamePlayState } from '../../pages/game-play/enums/game-play.enum'
import { TurnAndHint } from '../../pages/game-play/interfaces/turn-and-hint.interface'
import { User } from './user.interface'

export interface GlobalState {
	user: User | null
	showHowToPlay: boolean
	cues: string[] | null
	finalTriadCues: string[] | null
	selectedCues: string[]
	turns: TurnAndHint[]
	hints: TurnAndHint[]
	gamePlayState: GamePlayState
	triadsStep: 'INITIAL' | 'FINAL'
}
