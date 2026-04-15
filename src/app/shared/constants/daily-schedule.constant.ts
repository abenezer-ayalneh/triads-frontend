/**
 * Earliest selectable puzzle date for daily scheduling (tomorrow, local calendar).
 * Server stores puzzle dates as US Eastern calendar days.
 */
export function minDailySchedulePuzzleDateYmd(): string {
	const d = new Date()
	d.setDate(d.getDate() + 1)
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}
