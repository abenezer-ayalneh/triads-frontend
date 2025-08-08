import { GamePlayState } from '../../pages/game-play/enums/game-play.enum'
import { Cue, CueGroup } from '../../pages/game-play/interfaces/cue.interface'
import { TurnAndHint } from '../../pages/game-play/interfaces/turn-and-hint.interface'

export interface GlobalState {
	username: string | null
	showHowToPlay: boolean
	cueGroups: CueGroup[]
	fourthCueGroup: CueGroup | null
	selectedCues: Cue[]
	turns: TurnAndHint[]
	hints: TurnAndHint[]
	gamePlayState: GamePlayState
}
