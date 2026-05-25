import { Routes } from '@angular/router'

import { adminGuard } from './layouts/main-layout/guards/admin-guard'
import { playGuard } from './layouts/main-layout/guards/play.guard'
import { MainLayout } from './layouts/main-layout/main-layout'
import { GamePlay } from './pages/game-play/game-play'
import { TriadManagementPage } from './pages/triad-management/triad-management.page'

export const routes: Routes = [
	{
		path: '',
		component: MainLayout,
		children: [
			{
				path: '',
				loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
				pathMatch: 'full',
			},
			{
				path: 'classic',
				component: GamePlay,
				data: { mode: 'classic' },
				canActivate: [playGuard],
			},
			{
				path: 'daily',
				component: GamePlay,
				data: { mode: 'daily' },
				canActivate: [playGuard],
			},
			{
				path: 'manage-triads',
				component: TriadManagementPage,
				canActivate: [adminGuard],
			},
			{ path: '**', redirectTo: '' },
		],
	},
]
