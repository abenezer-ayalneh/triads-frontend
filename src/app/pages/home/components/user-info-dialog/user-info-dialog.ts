import { Component, computed, ElementRef, inject, model, OnInit, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

import { AssetPreloadService } from '../../../../shared/services/asset-preload.service'
import { UserService } from '../../../../shared/services/user.service'
import { GlobalStore } from '../../../../state/global.store'

const HOW_TO_PLAY_LOTTIE_PATH = 'lotties/how-to-play-lottie.json'
const PLAY_BUTTON_LOTTIE_PATH = 'lotties/play-button-lottie.json'

@Component({
	selector: 'app-user-info-dialog',
	imports: [FormsModule, LottieComponent],
	templateUrl: './user-info-dialog.html',
	styleUrl: './user-info-dialog.scss',
})
export class UserInfoDialog implements OnInit {
	readonly store = inject(GlobalStore)

	usernameInput = viewChild.required<ElementRef<HTMLInputElement>>('usernameInput')

	usernameModel = model<string | null>(null)

	generatedUsername: string | null = null

	readonly infoButtonLottieAnimationOptions = computed<AnimationOptions>(() => {
		this.assetPreloadService.lottieVersion()
		const animationData = this.assetPreloadService.getLottie(HOW_TO_PLAY_LOTTIE_PATH)
		return animationData ? { animationData } : { path: HOW_TO_PLAY_LOTTIE_PATH }
	})

	readonly playButtonLottieAnimationOptions = computed<AnimationOptions>(() => {
		this.assetPreloadService.lottieVersion()
		const animationData = this.assetPreloadService.getLottie(PLAY_BUTTON_LOTTIE_PATH)
		return animationData ? { animationData } : { path: PLAY_BUTTON_LOTTIE_PATH }
	})

	private readonly userService = inject(UserService)

	private readonly assetPreloadService = inject(AssetPreloadService)

	ngOnInit() {
		this.generateUsername()
		this.usernameInput().nativeElement.focus()
	}

	onSubmit() {
		const username = this.usernameModel()
		if (username) {
			this.userService.setUser({ username, scores: { 15: 0, 12: 0, 10: 0, 8: 0, 6: 0, 3: 0, 0: 0 }, firstGameDate: null })
			this.store.setUser({ username, scores: { 15: 0, 12: 0, 10: 0, 8: 0, 6: 0, 3: 0, 0: 0 }, firstGameDate: null })
		}
	}

	toggleHowToPlay() {
		this.store.setShowHowToPlay(true)
	}

	private generateUsername() {
		const generatedUsername = this.userService.generateUsername()
		this.generatedUsername = generatedUsername
		this.usernameModel.set(generatedUsername)
	}
}
