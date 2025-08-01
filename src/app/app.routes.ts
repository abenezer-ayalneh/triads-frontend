import { Routes } from '@angular/router'

import { MainLayout } from './layouts/main-layout/main-layout'
import { BubblesPage } from './pages/bubbles/bubbles.page'
import { GamePlay } from './pages/game-play/game-play'
import { HomePage } from './pages/home/home.page'

export const routes: Routes = [
	{
		path: '',
		component: MainLayout,
		children: [
			{
				path: '',
				component: HomePage,
			},
			{
				path: 'play',
				component: GamePlay,
			},
			{
				path: 'bubbles',
				component: BubblesPage,
			},
		],
	},
]
