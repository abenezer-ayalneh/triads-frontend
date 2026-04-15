import { Routes } from '@angular/router'

import { adminGuard } from '../layouts/main-layout/guards/admin-guard'
import { MainLayout } from '../layouts/main-layout/main-layout'
import { GamePlay } from '../pages/game-play/game-play'
import { TriadManagementPage } from '../pages/triad-management/triad-management.page'
import { dailyPlayGuard } from './guards/daily-play.guard'
import { DailyLandingPage } from './pages/daily-landing/daily-landing.page'

export const dailyRoutes: Routes = [
	{
		path: '',
		component: MainLayout,
		children: [
			{ path: '', component: DailyLandingPage },
			{ path: 'play', component: GamePlay, canActivate: [dailyPlayGuard] },
			{
				path: 'manage-daily-schedule',
				component: TriadManagementPage,
				canActivate: [adminGuard],
			},
		],
	},
]
