import { DatePipe } from '@angular/common'
import { Component, computed, inject, output, signal } from '@angular/core'
import { AgCharts } from 'ag-charts-angular'
import { AgChartOptions } from 'ag-charts-community'

import { UserService } from '../../../../shared/services/user.service'
import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-stats',
	imports: [AgCharts, DatePipe],
	templateUrl: './stats.html',
	styleUrl: './stats.scss',
})
export class Stats {
	whenClosingStatsWindow = output()

	showDataClearingConfirmation = signal<boolean>(false)

	chartOptions = computed<AgChartOptions>(() => ({
		title: {
			enabled: false,
		},
		// Data: Data to be displayed in the chart
		data: this.chartData(),

		// Series: Defines which chart type and data to use
		series: [
			{
				type: 'bar',
				direction: 'horizontal',
				xKey: 'score',
				yKey: 'percentage',
				cornerRadius: 8,
				label: {
					enabled: true,
					placement: 'inside-end',
					formatter: (params) => (params.value > 0 ? `${params.value}%` : ''),
				},
				tooltip: {
					enabled: true,
					renderer: (params) => `Count: ${params.datum.frequency}`,
				},
			},
		],
		axes: [
			{
				type: 'category',
				position: 'left',
				line: { enabled: false },
			},
			{
				type: 'number',
				position: 'bottom',
				label: {
					enabled: false, // Disable the default y-axis labels as the values are displayed in the bars
				},
			},
		],
		legend: {
			enabled: false,
		},
	}))

	protected readonly store = inject(GlobalStore)

	totalScore = computed(() => {
		return Object.values(this.store.user()?.scores ?? {}).reduce((acc, curr) => acc + curr, 0)
	})

	chartData = computed(() => {
		return this.generateChartData(this.store.user()?.scores ?? ({} as Record<number, number>))
	})

	private readonly userService = inject(UserService)

	resetData() {
		this.userService.clearUserData()
		window.location.reload()
	}

	toggleDataClearingConfirmation() {
		this.showDataClearingConfirmation.update((currentValue) => !currentValue)
	}

	onClose() {
		this.whenClosingStatsWindow.emit()
	}

	onBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			this.onClose()
		}
	}

	private generateChartData(scores: Record<number, number>): { score: string; frequency: number; percentage: number }[] {
		const totalPlayedGames = Object.values(scores).reduce((acc, curr) => acc + curr, 0)

		function generateScoreText(score: number) {
			if (score === 15) {
				return 'Perfect! 15'
			} else if (score === 12) {
				return 'Prideful 12'
			} else if (score === 10) {
				return 'Proper 10'
			} else if (score === 8) {
				return 'Passable 8'
			} else if (score === 6) {
				return 'Piss-poor 6'
			} else if (score === 3) {
				return 'Pitiable 3'
			}

			return 'Painful 0'
		}

		return Object.entries(scores).map(([score, frequency]) => ({
			score: generateScoreText(Number(score)),
			frequency,
			percentage: Math.round((frequency / totalPlayedGames) * 100),
		}))
	}
}
