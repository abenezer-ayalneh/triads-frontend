import { inject } from '@angular/core'
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from '@ngrx/signals'

import { GamePlayState } from '../pages/game-play/enums/game-play.enum'
import { Cue, CueGroup } from '../pages/game-play/interfaces/cue.interface'
import { TurnAndHint } from '../pages/game-play/interfaces/turn-and-hint.interface'
import { GlobalState } from '../shared/interfaces/global-state.interface'
import { User } from '../shared/interfaces/user.interface'
import { UserService } from '../shared/services/user.service'

const initialState: GlobalState = {
	user: null,
	showHowToPlay: false,
	cueGroups: [],
	fourthCueGroup: null,
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
	withProps(() => ({
		userService: inject(UserService),
	})),
	withState(initialState),
	withMethods((store) => ({
		setUser: (user: User | null) => {
			patchState(store, (state) => ({ ...state, user }))
		},
		setUserScore: (score: number) => {
			const user = store.user()
			if (user) {
				patchState(store, (state) => ({ ...state, user: { ...user, score } }))
			}
		},
		setShowHowToPlay: (value: boolean) => {
			patchState(store, (state) => ({ ...state, showHowToPlay: value }))
		},
		setCueGroups: (cueGroups: CueGroup[]) => {
			patchState(store, (state) => ({ ...state, cueGroups: [...cueGroups] }))
		},
		setFourthCueGroup: (cueGroup: CueGroup | null) => {
			patchState(store, (state) => ({ ...state, fourthCueGroup: cueGroup }))
		},
		setSelectedCues: (selectedCues: Cue[]) => {
			patchState(store, (state) => ({ ...state, selectedCues: [...selectedCues] }))
		},
		addSelectedCue: (selectedCue: Cue) => {
			patchState(store, (state) => ({ ...state, selectedCues: [...state.selectedCues, selectedCue] }))
		},
		removeSelectedCue: (selectedCue: Cue) => {
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
		markCuesAsSolved: (cues: Cue[]) => {
			const sampleCueIdToRemove = cues.map((cue) => cue.id)[0]
			const cueGroupToRemove = store.cueGroups().find((cueGroup) => cueGroup.cues.map((cue) => cue.id).includes(sampleCueIdToRemove))

			if (cueGroupToRemove) {
				patchState(store, (state) => ({
					...state,
					cueGroups: state.cueGroups.map((cueGroup) => (cueGroup.id === cueGroupToRemove.id ? { ...cueGroup, available: false } : cueGroup)),
				}))
			} else {
				const fourthCueGroup = store.fourthCueGroup()

				if (fourthCueGroup && fourthCueGroup.cues.map((cue) => cue.id).includes(sampleCueIdToRemove)) {
					patchState(store, (state) => ({ ...state, fourthCueGroup: { ...fourthCueGroup, available: false } }))
				}
			}
		},
	})),
	withHooks({
		onInit(store) {
			store.setUser(store.userService.getUser())
		},
	}),
)
