import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { GamePlayApi } from '../../../pages/game-play/services/game-play-api'
import { DAILY_CHALLENGE_NUMBER_OFFSET, DAILY_LANDING_ATTRIBUTION, DAILY_LANDING_TAGLINE } from '../../constants/daily-landing.constants'

@Component({
	selector: 'app-daily-landing',
	standalone: true,
	imports: [RouterLink],
	templateUrl: './daily-landing.page.html',
	styleUrl: './daily-landing.page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyLandingPage implements OnInit {
	private readonly gamePlayApi = inject(GamePlayApi)

	readonly tagline = DAILY_LANDING_TAGLINE

	readonly attribution = DAILY_LANDING_ATTRIBUTION

	readonly challengeLine = signal<string | null>(null)

	readonly challengeLoading = signal(true)

	readonly dailyCompleted = signal(false)

	ngOnInit() {
		this.gamePlayApi.getDailyTodayInfo().subscribe({
			next: (res) => {
				this.challengeLoading.set(false)
				if (res.scheduled) {
					this.challengeLine.set(`Challenge #${DAILY_CHALLENGE_NUMBER_OFFSET + res.triadGroupId}`)
					this.dailyCompleted.set(res.hasCompletedDaily === true)
				} else {
					this.challengeLine.set(null)
					this.dailyCompleted.set(false)
				}
			},
			error: () => {
				this.challengeLoading.set(false)
				this.challengeLine.set(null)
				this.dailyCompleted.set(false)
			},
		})
	}
}
