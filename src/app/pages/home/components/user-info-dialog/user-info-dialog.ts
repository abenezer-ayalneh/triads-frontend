import { Component, ElementRef, inject, model, OnInit, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatTooltip } from '@angular/material/tooltip'
import { AnimationOptions, LottieComponent } from 'ngx-lottie'

import { GlobalStore } from '../../../../state/global.store'
import { UserInfoDialogService } from './user-info-dialog.service'

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

	private readonly userInfoDialogService = inject(UserInfoDialogService)

	ngOnInit() {
		document.body.appendChild(this.elementRef.nativeElement)
		this.generateUsername()
		this.usernameInput().nativeElement.focus()
	}

	onSubmit() {
		const username = this.usernameModel()
		if (username) {
			this.userInfoDialogService.setUsername(username)
			this.store.setUsername(username)
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
