import { Routes } from '@angular/router'

import { usernameGuard } from './layouts/main-layout/guards/username-guard'
import { MainLayout } from './layouts/main-layout/main-layout'
import { GamePlay } from './pages/game-play/game-play'
import { HomePage } from './pages/home/home.page'

export const routes: Routes = [
	{
		path: '',
		component: MainLayout,
		children: [
			{
				path: 'home',
				component: HomePage,
			},
			{
				path: 'play',
				component: GamePlay,
				canActivate: [usernameGuard],
			},
			{ path: '', redirectTo: 'home', pathMatch: 'full' },
		],
	},
]
