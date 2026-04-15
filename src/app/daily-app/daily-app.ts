import { Component } from '@angular/core'
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone'

@Component({
	selector: 'app-daily-root',
	imports: [IonApp, IonRouterOutlet],
	templateUrl: './daily-app.html',
	styleUrl: './daily-app.scss',
})
export class DailyApp {
	title = 'Triads Daily'
}
