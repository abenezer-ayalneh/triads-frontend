import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'

import { Intro } from '../../shared/components/intro/intro'
import { GlobalStore } from '../../state/global.store'
import { UserInfoDialog } from './components/user-info-dialog/user-info-dialog'

@Component({
	selector: 'app-home',
	imports: [FormsModule, UserInfoDialog, RouterLink, Intro],
	templateUrl: './home.page.html',
	styleUrl: './home.page.scss',
})
export class HomePage {
	readonly store = inject(GlobalStore)
}
