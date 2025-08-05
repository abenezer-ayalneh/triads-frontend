import { NgClass } from '@angular/common'
import { Component, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core'
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'
import { delay, tap } from 'rxjs'

import { RequestState } from '../../shared/enums/request-state.enum'
import { SnackbarService } from '../../shared/services/snackbar.service'
import { GlobalStore } from '../../state/global.store'
import { BubblesPage } from '../bubbles/bubbles.page'
import { CueGroup } from './interfaces/cue.interface'
import { GamePlayApi } from './services/game-play-api'
import { HintService } from './services/hint-service'
import { TurnService } from './services/turn-service'

@Component({
	selector: 'app-game-play',
	imports: [BubblesPage, LottieComponent, ReactiveFormsModule, NgClass],
	templateUrl: './game-play.html',
	styleUrl: './game-play.scss',
})
export class GamePlay implements OnInit {
	readonly store = inject(GlobalStore)

	cueFetchingState = signal<RequestState>(RequestState.LOADING)

	cueGroups = signal<CueGroup[]>([])

	solutionStep = signal<'CHECK_TRIAD' | 'ANSWER' | null>(null)

	answerState = signal<'CORRECT' | 'WRONG' | null>(null)

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

	private readonly gamePlayApi = inject(GamePlayApi)

	private readonly turnService = inject(TurnService)

	private readonly hintService = inject(HintService)

	private readonly snackbarService = inject(SnackbarService)

	private readonly answerFieldRef = viewChild<ElementRef<HTMLInputElement>>('answerField')

	private readonly hintUseConfirmationModalRef = viewChild.required<ElementRef<HTMLDialogElement>>('hintUseConfirmationModal')

	constructor() {
		effect(() => {
			const selectedBubbles = this.store.selectedBubbles()

			if (selectedBubbles.length === 3) {
				this.solutionStep.set('CHECK_TRIAD')
			} else {
				this.solutionStep.set(null)
			}
		})
	}

	ngOnInit() {
		this.gamePlayApi.getCues().subscribe({
			next: (cueGroups) => {
				this.cueGroups.set(cueGroups)
				this.cueFetchingState.set(RequestState.READY)
			},
		})
	}

	submitAnswer() {
		if (this.answerFormControl.valid && this.answerFormControl.value) {
			this.gamePlayApi
				.checkAnswer(this.answerFormControl.value)
				.pipe(
					tap((success) => {
						if (success) {
							this.answerState.set('CORRECT')
						} else {
							this.answerState.set('WRONG')
							this.useCurrentTurn()
						}
					}),
					delay(3000),
				)
				.subscribe({
					next: (success) => {
						if (success) {
							this.store.setSelectedBubbles([])
						}

						this.answerFormControl.reset()
						this.answerState.set(null)
					},
				})
		}
	}

	useHint() {
		this.hintUseConfirmationModalRef().nativeElement.close()
		try {
			const useHintResponse = this.hintService.useHint(this.store.hints(), this.store.turns())
			this.store.setHints(useHintResponse.hints)
			this.store.setTurns(useHintResponse.turns)
		} catch (error) {
			this.snackbarService.showSnackbar(`Error: ${(error as { message: string }).message ?? 'Unknown error'}`)
		}
	}

	checkSolution() {
		const selectedBubbles = this.store.selectedBubbles()

		if (selectedBubbles.length === 3) {
			this.gamePlayApi.checkTriad(selectedBubbles.map((bubble) => bubble.cueId)).subscribe({
				next: (success) => {
					if (success) {
						this.solutionStep.set('ANSWER')
						this.answerFieldRef()?.nativeElement.focus()
					} else {
						// 	TODO: show a 'wrong triads' message
					}
				},
			})
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
