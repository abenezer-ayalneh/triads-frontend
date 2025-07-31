import { Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'

import { GlobalStore } from '../../state/global.store'

@Component({
	selector: 'app-main-layout',
	imports: [RouterOutlet],
	templateUrl: './main-layout.html',
	styleUrl: './main-layout.scss',
})
export class MainLayout {
	readonly store = inject(GlobalStore)
}
