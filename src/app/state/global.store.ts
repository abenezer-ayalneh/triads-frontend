import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'

import { GlobalState } from '../shared/interfaces/global-state.interface'

const initialState: GlobalState = {
	username: null,
}

export const GlobalStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withMethods((store) => ({
		setUsername: (username: string | null) => {
			patchState(store, (state) => ({ ...state, username }))
		},
	})),
)
