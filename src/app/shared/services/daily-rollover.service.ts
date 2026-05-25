import { Injectable } from '@angular/core'

const EASTERN_TIME_ZONE = 'America/New_York'
const MIN_ROLLOVER_RECHECK_DELAY_MS = 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** Calendar cell parts derived from a date in Eastern time (e.g. month "MAY", day "24"). */
export interface EasternCalendarLabel {
	month: string
	day: string
}

@Injectable({ providedIn: 'root' })
export class DailyRolloverService {
	private readonly easternDateFormatter = new Intl.DateTimeFormat('en-CA', {
		timeZone: EASTERN_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})

	private readonly easternDateTimePartsFormatter = new Intl.DateTimeFormat('en-US', {
		timeZone: EASTERN_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	})

	private readonly easternCalendarFormatter = new Intl.DateTimeFormat('en-US', {
		timeZone: EASTERN_TIME_ZONE,
		month: 'short',
		day: 'numeric',
	})

	/** Returns calendar-cell parts for the given date in Eastern time (defaults to now). */
	easternCalendarLabel(date: Date = new Date()): EasternCalendarLabel {
		const parts = this.easternCalendarFormatter.formatToParts(date)
		const month = parts.find((part) => part.type === 'month')?.value ?? ''
		const day = parts.find((part) => part.type === 'day')?.value ?? ''
		return { month: month.toUpperCase(), day }
	}

	startEasternDayWatcher(onDateChange: () => void): () => void {
		let rolloverTimeout: ReturnType<typeof setTimeout> | null = null
		let currentEasternDateKey = this.getEasternDateKey(new Date())

		const refreshForEasternDateRollover = () => {
			const easternDateKey = this.getEasternDateKey(new Date())
			if (currentEasternDateKey !== easternDateKey) {
				currentEasternDateKey = easternDateKey
				onDateChange()
			}
			scheduleEasternMidnightRefresh()
		}

		const handlePageBecameActive = () => {
			if (document.visibilityState !== 'visible') {
				return
			}
			refreshForEasternDateRollover()
		}

		const scheduleEasternMidnightRefresh = () => {
			if (rolloverTimeout) {
				clearTimeout(rolloverTimeout)
			}

			const now = new Date()
			const nextMidnightTimestamp = this.getNextEasternMidnightTimestamp(now)
			const delayMs = Math.max(MIN_ROLLOVER_RECHECK_DELAY_MS, nextMidnightTimestamp - now.getTime())
			rolloverTimeout = setTimeout(() => refreshForEasternDateRollover(), delayMs)
		}

		scheduleEasternMidnightRefresh()
		window.addEventListener('focus', handlePageBecameActive)
		document.addEventListener('visibilitychange', handlePageBecameActive)

		return () => {
			if (rolloverTimeout) {
				clearTimeout(rolloverTimeout)
				rolloverTimeout = null
			}
			window.removeEventListener('focus', handlePageBecameActive)
			document.removeEventListener('visibilitychange', handlePageBecameActive)
		}
	}

	private getEasternDateKey(date: Date): string {
		return this.easternDateFormatter.format(date)
	}

	private getNextEasternMidnightTimestamp(now: Date): number {
		const nowParts = this.getEasternDateTimeParts(now)
		const todayEasternUtcTimestamp = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day)
		const tomorrowEasternDate = new Date(todayEasternUtcTimestamp + ONE_DAY_MS)
		const nextYear = tomorrowEasternDate.getUTCFullYear()
		const nextMonth = tomorrowEasternDate.getUTCMonth() + 1
		const nextDay = tomorrowEasternDate.getUTCDate()

		let nextMidnightUtcTimestamp = Date.UTC(nextYear, nextMonth - 1, nextDay, 0, 0, 0)
		for (let i = 0; i < 3; i++) {
			const offset = this.getEasternTimeOffsetMs(new Date(nextMidnightUtcTimestamp))
			nextMidnightUtcTimestamp = Date.UTC(nextYear, nextMonth - 1, nextDay, 0, 0, 0) - offset
		}

		return nextMidnightUtcTimestamp
	}

	private getEasternTimeOffsetMs(date: Date): number {
		const parts = this.getEasternDateTimeParts(date)
		const easternAsUtcTimestamp = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
		return easternAsUtcTimestamp - date.getTime()
	}

	private getEasternDateTimeParts(date: Date): {
		year: number
		month: number
		day: number
		hour: number
		minute: number
		second: number
	} {
		const parts = this.easternDateTimePartsFormatter.formatToParts(date)
		return {
			year: this.readDatePart(parts, 'year'),
			month: this.readDatePart(parts, 'month'),
			day: this.readDatePart(parts, 'day'),
			hour: this.readDatePart(parts, 'hour'),
			minute: this.readDatePart(parts, 'minute'),
			second: this.readDatePart(parts, 'second'),
		}
	}

	private readDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
		const value = parts.find((part) => part.type === type)?.value
		return value ? Number(value) : 0
	}
}
