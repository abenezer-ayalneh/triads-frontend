import { JsonPipe, NgClass } from '@angular/common'
import { Component, computed, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core'
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'
import { delay, filter, tap } from 'rxjs'

import { Bubble } from '../../components/bubble/bubble'
import { RequestState } from '../../shared/enums/request-state.enum'
import { SnackbarService } from '../../shared/services/snackbar.service'
import { GlobalStore } from '../../state/global.store'
import { GamePlayState } from './enums/game-play.enum'
import { Cue } from './interfaces/cue.interface'
import { GamePlayApi } from './services/game-play-api'
import { HintService } from './services/hint-service'
import { TurnService } from './services/turn-service'

@Component({
	selector: 'app-game-play',
	imports: [LottieComponent, ReactiveFormsModule, NgClass, Bubble, JsonPipe],
	templateUrl: './game-play.html',
	styleUrl: './game-play.scss',
})
export class GamePlay implements OnInit {
	readonly store = inject(GlobalStore)

	cueFetchingState = signal<RequestState>(RequestState.LOADING)

	availableTurns = computed(() => this.store.turns().filter((turn) => turn.available).length)

	visibleCues = computed<Cue[]>(() =>
		this.store
			.cueGroups()
			.filter((cueGroup) => cueGroup.available)
			.map((cueGroup) => cueGroup.cues)
			.flat(),
	)

	ranOutOfTurns = computed(() => this.store.turns().filter((turn) => turn.available).length === 0)

	answerFormControl = new FormControl<string>('', { validators: [Validators.required] })

	loadingAnimationOptions: AnimationOptions = {
		path: '/lotties/loading-lottie.json',
	}

	wrongAnswerAnimationOptions: AnimationOptions = {
		path: '/lotties/wrong-answer-lottie.json',
	}

	correctAnswerAnimationOptions: AnimationOptions = {
		path: '/lotties/correct-answer-lottie.json',
	}

	protected readonly RequestState = RequestState

	protected readonly length = length

	protected readonly GamePlayState = GamePlayState

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly turnService = inject(TurnService)

	private readonly hintService = inject(HintService)

	private readonly snackbarService = inject(SnackbarService)

	private readonly answerFieldRef = viewChild<ElementRef<HTMLInputElement>>('answerField')

	private readonly hintUseConfirmationModalRef = viewChild.required<ElementRef<HTMLDialogElement>>('hintUseConfirmationModal')

	constructor() {
		effect(() => {
			const selectedCues = this.store.selectedCues()

			if (selectedCues.length === 3) {
				this.store.setGamePlayState(GamePlayState.CHECK_SOLUTION)
			} else {
				this.store.setGamePlayState(GamePlayState.PLAYING)
			}
		})
	}

	ngOnInit() {
		this.store.setGamePlayState(GamePlayState.PLAYING)
		this.gamePlayApi.getCues().subscribe({
			next: (cueGroups) => {
				this.store.setCueGroups(cueGroups)
				this.cueFetchingState.set(RequestState.READY)
			},
		})
	}

	useHint() {
		this.hintUseConfirmationModalRef().nativeElement.close()
		try {
			const useHintResponse = this.hintService.useHint(this.store.hints(), this.store.turns())
			this.store.setHints(useHintResponse.hints)
			this.store.setTurns(useHintResponse.turns)

			this.store.setSelectedCues(this.hintService.getHintTriadCues(this.store.cueGroups()))
		} catch (error) {
			this.snackbarService.showSnackbar(`Error: ${(error as { message: string }).message ?? 'Unknown error'}`)
		}
	}

	checkTriad() {
		const selectedCues = this.store.selectedCues()

		if (selectedCues.length === 3) {
			this.gamePlayApi
				.checkTriad(selectedCues.map((cue) => cue.id))
				.pipe(
					tap((success) => {
						if (success) {
							this.store.setGamePlayState(GamePlayState.ACCEPT_ANSWER)
							this.answerFieldRef()?.nativeElement.focus()
						} else {
							this.store.setGamePlayState(GamePlayState.WRONG_TRIAD)
							this.useCurrentTurn()
						}
					}),
					filter((success) => !success),
					delay(3000),
					tap(() => {
						this.store.setGamePlayState(GamePlayState.PLAYING)
						this.store.setSelectedCues([])
					}),
				)
				.subscribe()
		}
	}

	submitAnswer() {
		if (this.answerFormControl.valid && this.answerFormControl.value) {
			this.gamePlayApi
				.checkAnswer(this.answerFormControl.value)
				.pipe(
					tap((success) => {
						if (success) {
							this.store.setGamePlayState(GamePlayState.CORRECT_ANSWER)
						} else {
							this.store.setGamePlayState(GamePlayState.WRONG_ANSWER)
							this.useCurrentTurn()
						}

						this.answerFormControl.reset()
					}),
					delay(3000),
				)
				.subscribe({
					next: (success) => {
						if (success) {
							this.store.removeSolvedCues(this.store.selectedCues())
							this.store.setSelectedCues([])
							this.store.setGamePlayState(GamePlayState.PLAYING)
						} else {
							this.store.setGamePlayState(GamePlayState.ACCEPT_ANSWER)
							this.answerFieldRef()?.nativeElement.focus()
						}
					},
				})
		}
	}

	bubbleClicked(cue: Cue) {
		const selectedCues = this.store.selectedCues()
		const isCueSelected = selectedCues.some((selectedCues) => selectedCues.id === cue.id)

		if (isCueSelected) {
			this.store.removeSelectedCues(cue)
		} else {
			if (selectedCues.length < 3) {
				this.store.addSelectedCues(cue)
			}
		}
	}

	private useCurrentTurn() {
		try {
			const turnsAfterUsage = this.turnService.useTurn(this.store.turns())
			this.store.setTurns(turnsAfterUsage)
		} catch (error) {
			this.snackbarService.showSnackbar(`Error: ${(error as { message: string }).message ?? 'Unknown error'}`)
		}
	}
}
