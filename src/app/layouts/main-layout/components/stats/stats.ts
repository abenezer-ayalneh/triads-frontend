import { DatePipe, DecimalPipe } from '@angular/common'
import { Component, computed, inject, output } from '@angular/core'
import { AgCharts } from 'ag-charts-angular'
import { AgChartOptions, AllCommunityModule, ModuleRegistry } from 'ag-charts-community'

import { Dialog } from '../../../../shared/components/dialog/dialog'
import { GlobalStore } from '../../../../state/global.store'

@Component({
	selector: 'app-stats',
	imports: [AgCharts, DatePipe, DecimalPipe, Dialog],
	templateUrl: './stats.html',
	styleUrl: './stats.scss',
	providers: [DecimalPipe],
})
export class Stats {
	whenClosingStatsWindow = output()

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
					placement: 'outside-end',
					formatter: (params) => (params.value > 0 ? `${params.value}%` : ''),
				},
				tooltip: {
					enabled: true,
					renderer: (params) => `Count: ${params.datum.frequency}`,
				},
			},
		],
		axes: {
			y: {
				type: 'category',
				line: { enabled: false },
			},
			x: {
				type: 'number',
				max: 105,
				gridLine: { enabled: false },
				label: {
					enabled: false, // Disable the default y-axis labels as the values are displayed in the bars
				},
			},
		},
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

	averageScore = computed(() => {
		const scores = this.store.user()?.scores ?? {}
		const sum = Object.entries(scores).reduce((acc, [key, value]) => acc + Number(key) * value, 0)
		const totalGamesPlayed = Object.values(scores).reduce((acc, curr) => acc + curr, 0)
		return totalGamesPlayed > 0 ? sum / totalGamesPlayed : 0
	})

	private readonly decimalPipe = inject(DecimalPipe)

	constructor() {
		ModuleRegistry.registerModules([AllCommunityModule])
	}

	onClose() {
		this.whenClosingStatsWindow.emit()
	}

	private generateChartData(scores: Record<number, number>): { score: string; frequency: number; percentage: number }[] {
		const totalPlayedGames = Object.values(scores).reduce((acc, curr) => acc + curr, 0)

		function generateScoreText(score: number) {
			if (score === 15) {
				return 'Perfect! 15'
			} else if (score === 12) {
				return 'Prideful 12'
			} else if (score === 10) {
				return 'Proficient 10'
			} else if (score === 8) {
				return 'Passable 8'
			} else if (score === 6) {
				return 'Piss-poor 6'
			} else if (score === 3) {
				return 'Pitiable 3'
			}

			return 'Painful 0'
		}

		return Object.entries(scores)
			.sort(([a], [b]) => Number(b) - Number(a))
			.map(([score, frequency]) => ({
				score: generateScoreText(Number(score)),
				frequency,
				percentage: Number(this.decimalPipe.transform((frequency / totalPlayedGames) * 100, '1.0-1') ?? '0'),
			}))
	}
}
