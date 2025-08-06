import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'

import { GamePlayState } from '../pages/game-play/enums/game-play.enum'
import { Cue, CueGroup } from '../pages/game-play/interfaces/cue.interface'
import { TurnAndHint } from '../pages/game-play/interfaces/turn-and-hint.interface'
import { GlobalState } from '../shared/interfaces/global-state.interface'

const initialState: GlobalState = {
	username: null,
	showHowToPlay: false,
	cueGroups: [],
	selectedCues: [],
	turns: [
		{ id: 1, available: true },
		{ id: 2, available: true },
		{ id: 3, available: true },
	],
	hints: [
		{ id: 1, available: true },
		{ id: 2, available: true },
	],
	gamePlayState: GamePlayState.IDLE,
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
		setCueGroups: (cueGroups: CueGroup[]) => {
			patchState(store, (state) => ({ ...state, cueGroups: [...cueGroups] }))
		},
		setSelectedCues: (selectedCues: Cue[]) => {
			patchState(store, (state) => ({ ...state, selectedCues: [...selectedCues] }))
		},
		addSelectedCues: (selectedCue: Cue) => {
			patchState(store, (state) => ({ ...state, selectedCues: [...state.selectedCues, selectedCue] }))
		},
		removeSelectedCues: (selectedCue: Cue) => {
			patchState(store, (state) => ({ ...state, selectedCues: state.selectedCues.filter((cue) => cue.id !== selectedCue.id) }))
		},
		setTurns: (turns: TurnAndHint[]) => {
			patchState(store, (state) => ({ ...state, turns: [...turns] }))
		},
		setHints: (hints: TurnAndHint[]) => {
			patchState(store, (state) => ({ ...state, hints: [...hints] }))
		},
		setGamePlayState(gamePlayState: GamePlayState) {
			patchState(store, (state) => ({ ...state, gamePlayState }))
		},
		removeSolvedCues: (cues: Cue[]) => {
			const sampleCueIdToRemove = cues.map((cue) => cue.id)[0]
			const cueGroupToRemove = store.cueGroups().find((cueGroup) => cueGroup.cues.map((cue) => cue.id).includes(sampleCueIdToRemove))

			patchState(store, (state) => ({
				...state,
				cueGroups: state.cueGroups.map((cueGroup) => (cueGroup.id === cueGroupToRemove?.id ? { ...cueGroup, available: false } : cueGroup)),
			}))
		},
	})),
	withHooks({
		onInit(store) {
			store.setUsername(localStorage.getItem('username'))
		},
	}),
)
