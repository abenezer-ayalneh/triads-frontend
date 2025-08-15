import { Component, ElementRef, inject, model, OnInit, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatTooltip } from '@angular/material/tooltip'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

import { UserService } from '../../../../shared/services/user.service'
import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-user-info-dialog',
	imports: [FormsModule, LottieComponent, MatTooltip],
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

	private readonly userInfoDialogService = inject(UserService)

	ngOnInit() {
		document.body.appendChild(this.elementRef.nativeElement)
		this.generateUsername()
		this.usernameInput().nativeElement.focus()
	}

	onSubmit() {
		const username = this.usernameModel()
		if (username) {
			this.store.setUser({ username, score: 0 })
		}
	}

	toggleHowToPlay() {
		this.store.setShowHowToPlay(true)
	}

	private generateUsername() {
		const generatedUsername = this.userInfoDialogService.generateUsername()
		this.generatedUsername = generatedUsername
		this.usernameModel.set(generatedUsername)
	}
}
