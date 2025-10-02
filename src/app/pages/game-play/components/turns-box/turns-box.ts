import { NgClass } from '@angular/common'
import { Component, inject } from '@angular/core'

import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-turns-box',
	imports: [NgClass],
	templateUrl: './turns-box.html',
	styleUrl: './turns-box.scss',
})
export class TurnsBox {
	readonly store = inject(GlobalStore)
}
