import { NgClass } from '@angular/common'
import { Component, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core'
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'
import { delay, tap } from 'rxjs'

import { RequestState } from '../../shared/enums/request-state.enum'
import { GlobalStore } from '../../state/global.store'
import { BubblesPage } from '../bubbles/bubbles.page'
import { GamePlayApi } from './game-play-api'
import { CueGroup } from './interfaces/cue.interface'

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

	answerFormControl = new FormControl<string>('', { validators: [Validators.required] })

	answerState = signal<'CORRECT' | 'WRONG' | null>(null)

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

	private readonly answerFieldRef = viewChild<ElementRef<HTMLInputElement>>('answerField')

	constructor() {
		effect(() => {
			if (this.store.showAnswerField()) {
				this.answerFieldRef()?.nativeElement.focus()
				this.answerFormControl.enable()
			} else {
				this.answerFieldRef()?.nativeElement.blur()
				this.answerFormControl.disable()
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
							this.store.setBubbles(this.store.bubbles().map((bubble) => ({ ...bubble, isSelected: false })))
						}

						this.answerFormControl.reset()
						this.answerState.set(null)
					},
				})
		}
	}

	private useCurrentTurn() {
		const availableTurns = this.store.turns().filter((turn) => turn.available)

		if (availableTurns.length > 0) {
			this.store.useTurn(availableTurns[availableTurns.length - 1].id)
		}
	}
}
