import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'

import { Bubble } from '../pages/bubbles/interfaces/bubble.interface'
import { GlobalState } from '../shared/interfaces/global-state.interface'

const initialState: GlobalState = {
	username: null,
	showHowToPlay: false,
	bubbles: [],
	showAnswerField: false,
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
	withComputed(({ bubbles }) => ({
		showAnswerField: computed(() => bubbles().filter((bubble) => bubble.isSelected).length === 3),
	})),
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
		useTurn: (turnId: number) => {
			const turns = store.turns()
			const usedTurn = turns.find((turn) => turn.id === turnId)
			const updatedTurns = turns.map((turn) => ({ ...turn, available: turn.id === usedTurn?.id ? false : turn.available }))

			patchState(store, (state) => ({ ...state, turns: updatedTurns }))
		},
		useHint: (hintId: number) => {
			const hints = store.hints()
			const usedHint = hints.find((hint) => hint.id === hintId)
			const updatedHints = hints.map((hint) => ({ ...hint, available: hint.id !== usedHint?.id }))

			patchState(store, (state) => ({ ...state, hints: updatedHints }))
		},
	})),
	withHooks({
		onInit(store) {
			store.setUsername(localStorage.getItem('username'))
		},
	}),
)
