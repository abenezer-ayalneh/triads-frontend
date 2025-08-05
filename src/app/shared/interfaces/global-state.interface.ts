import { Bubble, SelectedBubble } from '../../pages/bubbles/interfaces/bubble.interface'
import { TurnAndHint } from '../../pages/game-play/interfaces/turn-and-hint.interface'

export interface GlobalState {
	username: string | null
	showHowToPlay: boolean
	bubbles: Bubble[]
	selectedBubbles: SelectedBubble[]
	turns: TurnAndHint[]
	hints: TurnAndHint[]
}
