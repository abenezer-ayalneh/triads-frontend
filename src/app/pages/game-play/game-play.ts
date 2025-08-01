import { Component } from '@angular/core'

import { BubblesPage } from '../bubbles/bubbles.page'

@Component({
	selector: 'app-game-play',
	imports: [BubblesPage],
	templateUrl: './game-play.html',
	styleUrl: './game-play.scss',
})
export class GamePlay {}
