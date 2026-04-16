/**
 * Today’s calendar date (YYYY-MM-DD) in US Eastern time — same basis as server puzzle dates.
 * Used as the minimum selectable date so admins can schedule for today or any future day.
 */
export function minDailySchedulePuzzleDateYmd(): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/New_York',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date())
}
