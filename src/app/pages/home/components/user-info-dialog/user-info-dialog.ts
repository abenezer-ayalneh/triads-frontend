import { Component, ElementRef, inject, model, OnInit, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

import { UserService } from '../../../../shared/services/user.service'
import { GlobalStore } from '../../../../state/global.store'

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

	infoButtonLottieAnimationOptions: AnimationOptions = {
		path: '/lotties/how-to-play-lottie.json',
	}

	playButtonLottieAnimationOptions: AnimationOptions = {
		path: '/lotties/play-button-lottie.json',
	}

	private readonly elementRef = inject(ElementRef)

	private readonly userService = inject(UserService)

	ngOnInit() {
		document.body.appendChild(this.elementRef.nativeElement)
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
