import { inject } from '@angular/core'
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from '@ngrx/signals'

import { GamePlayState } from '../pages/game-play/enums/game-play.enum'
import { SolvedTriad } from '../pages/game-play/interfaces/triad.interface'
import { TurnAndHint } from '../pages/game-play/interfaces/turn-and-hint.interface'
import { GlobalState } from '../shared/interfaces/global-state.interface'
import { User } from '../shared/interfaces/user.interface'
import { UserService } from '../shared/services/user.service'

const initialState: GlobalState = {
	user: null,
	showHowToPlay: false,
	cues: null,
	finalTriadCues: null,
	selectedCues: [],
	turns: [
		{ id: 1, available: true, icon: 'images/turn-one.png' },
		{ id: 2, available: true, icon: 'images/turn-two.png' },
		{ id: 3, available: true, icon: 'images/turn-three.png' },
	],
	hints: [
		{ id: 1, available: true },
		{ id: 2, available: true },
	],
	gamePlayState: GamePlayState.IDLE,
	triadsStep: 'INITIAL',
	keywordLengthHint: null,
	solvedTriads: [],
	hintUsed: false,
	isFetchingFinalTriadCues: false,
	gameScore: 0,
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
		setCues: (cues: string[]) => {
			patchState(store, (state) => ({ ...state, cues: [...cues] }))
		},
		removeSolvedCues: (cues: string[]) => {
			patchState(store, (state) => ({ ...state, cues: state.cues?.filter((cue) => !cues.includes(cue)) }))
		},
		setFinalTriadCues: (triad: string[] | null) => {
			patchState(store, (state) => ({ ...state, finalTriadCues: triad }))
		},
		setSelectedCues: (selectedCues: string[]) => {
			patchState(store, (state) => ({ ...state, selectedCues: [...selectedCues] }))
		},
		addSelectedCue: (selectedCue: string) => {
			patchState(store, (state) => ({ ...state, selectedCues: [...state.selectedCues, selectedCue] }))
		},
		removeSelectedCue: (selectedCue: string) => {
			patchState(store, (state) => ({ ...state, selectedCues: state.selectedCues.filter((cue) => cue !== selectedCue) }))
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
		updateTriadStep: (triadsStep: 'INITIAL' | 'FINAL') => {
			patchState(store, (state) => ({ ...state, triadsStep }))
		},
		setKeywordLengthHint: (keywordLengthHint: number | null) => {
			patchState(store, (state) => ({ ...state, keywordLengthHint }))
		},
		addSolvedTriad: (solvedTriad: SolvedTriad) => {
			patchState(store, (state) => ({ ...state, solvedTriads: [...state.solvedTriads, solvedTriad] }))
		},
		setHintUsage: (hintUsed: boolean) => {
			patchState(store, (state) => ({ ...state, hintUsed }))
		},
		setIsFetchingFinalTriadCues: (isFetchingFinalTriadCues: boolean) => {
			patchState(store, (state) => ({ ...state, isFetchingFinalTriadCues }))
		},
	})),
	withHooks({
		onInit(store) {
			store.setUser(store.userService.getUser())
		},
	}),
)
