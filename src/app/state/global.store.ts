import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'

import { Bubble } from '../pages/bubbles/interfaces/bubble.interface'
import { GlobalState } from '../shared/interfaces/global-state.interface'

const initialState: GlobalState = {
	username: null,
	showHowToPlay: false,
	bubbles: [],
	isAnswerFieldVisible: false,
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
		isAnswerFieldVisible: computed(() => bubbles().filter((bubble) => bubble.isSelected).length === 3),
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
		useTurn: () => {
			const turns = store.turns()
			const availableTurns = turns.filter((turn) => turn.available)

			if (availableTurns.length > 0) {
				const updatedTurns = turns.map((turn) => ({
					...turn,
					available: turn.id === availableTurns[availableTurns.length - 1].id ? false : turn.available,
				}))
				patchState(store, (state) => ({ ...state, turns: updatedTurns }))
			}
		},
		useHint: () => {
			const hints = store.hints()
			const turns = store.turns()
			const availableHints = hints.filter((hint) => hint.available)
			const availableTurns = turns.filter((turn) => turn.available)

			if (availableHints.length > 0 && availableTurns.length > 0) {
				const updatedHints = hints.map((hint) => ({
					...hint,
					available: hint.id === availableHints[availableHints.length - 1].id ? false : hint.available,
				}))
				const updatedTurns = turns.map((turn) => ({
					...turn,
					available: turn.id === availableTurns[availableTurns.length - 1].id ? false : turn.available,
				}))
				patchState(store, (state) => ({ ...state, hints: updatedHints, turns: updatedTurns }))
			}
		},
	})),
	withHooks({
		onInit(store) {
			store.setUsername(localStorage.getItem('username'))
		},
	}),
)
