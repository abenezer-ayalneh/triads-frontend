import { Component, inject, OnInit, signal } from '@angular/core'
import { AnimationItem } from 'lottie-web'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

import { RequestState } from '../../shared/enums/request-state.enum'
import { BubblesPage } from '../bubbles/bubbles.page'
import { GamePlayApi } from './game-play-api'
import { CueGroup } from './interfaces/cue.interface'

@Component({
	selector: 'app-game-play',
	imports: [BubblesPage, LottieComponent],
	templateUrl: './game-play.html',
	styleUrl: './game-play.scss',
})
export class GamePlay implements OnInit {
	cueFetchingState = signal<RequestState>(RequestState.LOADING)

	cueGroups = signal<CueGroup[]>([])

	lottieAnimationOptions: AnimationOptions = {
		path: '/lotties/loading-lottie.json',
	}

	protected readonly RequestState = RequestState

	private readonly gamePlayApi = inject(GamePlayApi)

	animationCreated(animationItem: AnimationItem): void {
		console.log(animationItem)
	}

	ngOnInit() {
		this.gamePlayApi.getCues().subscribe({
			next: (cueGroups) => {
				this.cueGroups.set(cueGroups)
				this.cueFetchingState.set(RequestState.READY)
			},
		})
	}
}
