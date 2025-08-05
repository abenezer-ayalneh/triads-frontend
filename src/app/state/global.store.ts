import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'

import { Bubble, SelectedBubble } from '../pages/bubbles/interfaces/bubble.interface'
import { TurnAndHint } from '../pages/game-play/interfaces/turn-and-hint.interface'
import { GlobalState } from '../shared/interfaces/global-state.interface'

const initialState: GlobalState = {
	username: null,
	showHowToPlay: false,
	bubbles: [],
	selectedBubbles: [],
	turns: [
		{ id: 1, available: true },
		{ id: 2, available: true },
		{ id: 3, available: true },
	],
	hints: [
		{ id: 1, available: true },
		{ id: 2, available: true },
	],
}

export const GlobalStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withMethods((store) => ({
		setUsername: (username: string | null) => {
			patchState(store, (state) => ({ ...state, username }))
		},
		setShowHowToPlay: (value: boolean) => {
			patchState(store, (state) => ({ ...state, showHowToPlay: value }))
		},
		setBubbles: (bubbles: Bubble[]) => {
			patchState(store, (state) => ({ ...state, bubbles }))
		},
		setSelectedBubbles: (selectedBubbles: SelectedBubble[]) => {
			patchState(store, (state) => ({ ...state, selectedBubbles: selectedBubbles }))
		},
		addSelectedBubbles: (selectedBubble: SelectedBubble) => {
			patchState(store, (state) => ({ ...state, selectedBubbles: [...state.selectedBubbles, selectedBubble] }))
		},
		removeSelectedBubbles: (selectedBubble: SelectedBubble) => {
			patchState(store, (state) => ({ ...state, selectedBubbles: state.selectedBubbles.filter((bubble) => bubble.id !== selectedBubble.id) }))
		},
		setTurns: (turns: TurnAndHint[]) => {
			patchState(store, (state) => ({ ...state, turns }))
		},
		setHints: (hints: TurnAndHint[]) => {
			patchState(store, (state) => ({ ...state, hints }))
		},
	})),
	withHooks({
		onInit(store) {
			store.setUsername(localStorage.getItem('username'))
		},
	}),
)
