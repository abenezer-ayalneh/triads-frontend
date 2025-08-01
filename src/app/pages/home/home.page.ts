import { JsonPipe } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'

import { GlobalStore } from '../../state/global.store'
import { UserInfoDialog } from './components/user-info-dialog/user-info-dialog'
import { UserInfoDialogService } from './components/user-info-dialog/user-info-dialog.service'

@Component({
	selector: 'app-home',
	imports: [FormsModule, UserInfoDialog, RouterLink, JsonPipe],
	templateUrl: './home.page.html',
	styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
	readonly store = inject(GlobalStore)

	private readonly userInfoDialogService = inject(UserInfoDialogService)

	ngOnInit() {
		this.prepareUser()
	}

	private prepareUser() {
		this.store.setUsername(this.userInfoDialogService.getUsername())
	}
}
