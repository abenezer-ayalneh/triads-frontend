import { Component, ElementRef, inject, model, OnInit, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'

import { GlobalStore } from '../../../../state/global.store'
import { UserInfoDialogService } from './user-info-dialog.service'

@Component({
	selector: 'app-user-info-dialog',
	imports: [FormsModule],
	templateUrl: './user-info-dialog.html',
	styleUrl: './user-info-dialog.scss',
})
export class UserInfoDialog implements OnInit {
	readonly store = inject(GlobalStore)

	usernameInput = viewChild.required<ElementRef<HTMLInputElement>>('usernameInput')

	usernameModel = model<string | null>(null)

	generatedUsername: string | null = null

	private readonly elementRef = inject(ElementRef)

	private readonly userInfoDialogService = inject(UserInfoDialogService)

	ngOnInit() {
		document.body.appendChild(this.elementRef.nativeElement)
		this.usernameInput().nativeElement.focus()
		this.generateUsername()
	}

	onSubmit() {
		const username = this.usernameModel()
		if (username) {
			this.userInfoDialogService.setUsername(username)
			this.store.setUsername(username)
		}
	}

	private generateUsername() {
		const generatedUsername = this.userInfoDialogService.generateUsername()
		this.generatedUsername = generatedUsername
		this.usernameModel.set(generatedUsername)
	}
}
