import { Component, inject, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'

import { UserService } from '../../shared/services/user.service'
import { GlobalStore } from '../../state/global.store'
import { UserInfoDialog } from './components/user-info-dialog/user-info-dialog'

@Component({
	selector: 'app-home',
	imports: [FormsModule, UserInfoDialog, RouterLink],
	templateUrl: './home.page.html',
	styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
	readonly store = inject(GlobalStore)

	private readonly userInfoDialogService = inject(UserService)

	ngOnInit() {
		this.prepareUser()
	}

	private prepareUser() {
		// this.store.setUser(this.userInfoDialogService.getUser()?.username)
	}
}
