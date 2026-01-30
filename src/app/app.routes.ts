import { Routes } from '@angular/router'

import { adminGuard } from './layouts/main-layout/guards/admin-guard'
import { usernameGuard } from './layouts/main-layout/guards/username-guard'
import { MainLayout } from './layouts/main-layout/main-layout'
import { GamePlay } from './pages/game-play/game-play'
import { TriadManagementPage } from './pages/triad-management/triad-management.page'

export const routes: Routes = [
	{
		path: '',
		component: MainLayout,
		children: [
			{
				path: 'home',
				loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
			},
			{
				path: 'play',
				component: GamePlay,
				canActivate: [usernameGuard],
			},
			{
				path: 'manage-triads',
				component: TriadManagementPage,
				canActivate: [adminGuard],
			},
			{ path: '', redirectTo: 'home', pathMatch: 'full' },
		],
	},
]
