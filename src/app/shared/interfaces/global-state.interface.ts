import { GamePlayState } from '../../pages/game-play/enums/game-play.enum'
import { Cue, CueGroup } from '../../pages/game-play/interfaces/cue.interface'
import { TurnAndHint } from '../../pages/game-play/interfaces/turn-and-hint.interface'
import { User } from './user.interface'

export interface GlobalState {
	user: User | null
	showHowToPlay: boolean
	cueGroups: CueGroup[]
	fourthCueGroup: CueGroup | null
	selectedCues: Cue[]
	turns: TurnAndHint[]
	hints: TurnAndHint[]
	gamePlayState: GamePlayState
	triadsStep: 'INITIAL' | 'FOURTH'
}
