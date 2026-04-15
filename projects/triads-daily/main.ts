import { bootstrapApplication } from '@angular/platform-browser'

import { DailyApp } from '../../src/app/daily-app/daily-app'
import { dailyAppConfig } from '../../src/app/daily-app/daily-app.config'

void bootstrapApplication(DailyApp, dailyAppConfig).catch((err) => console.error(err))
