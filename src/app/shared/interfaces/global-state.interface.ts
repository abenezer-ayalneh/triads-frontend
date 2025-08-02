import { Bubble } from '../../pages/bubbles/interfaces/bubble.interface'

export interface GlobalState {
	username: string | null
	showHowToPlay: boolean
	bubbles: Bubble[]
	showAnswerField: boolean
	turns: { id: number; available: boolean }[]
	hints: { id: number; available: boolean }[]
}
