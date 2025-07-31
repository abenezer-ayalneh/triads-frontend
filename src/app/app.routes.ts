import { Routes } from '@angular/router'

import { MainLayout } from './layouts/main-layout/main-layout'
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
		],
	},
]
