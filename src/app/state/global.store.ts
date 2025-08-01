import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'

import { GlobalState } from '../shared/interfaces/global-state.interface'

const initialState: GlobalState = {
	username: null,
	showHowToPlay: false,
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
	})),
	withHooks({
		onInit(store) {
			store.setUsername(localStorage.getItem('username'))
		},
	}),
)
