import { STATS_SCHEMA_VERSION, STATS_SCHEMA_VERSION_KEY } from '../constants/global.constant'

const USER_STORAGE_KEY = 'user'
const ANONYMOUS_ID_STORAGE_KEY = 'triads_anonymous_id'

export function getStoredStatsSchemaVersion(): number {
	const raw = localStorage.getItem(STATS_SCHEMA_VERSION_KEY)
	if (!raw) {
		return 1
	}

	const parsed = Number(raw)
	return Number.isFinite(parsed) ? parsed : 1
}

export function runStatsSchemaMigrationIfNeeded(): void {
	if (getStoredStatsSchemaVersion() >= STATS_SCHEMA_VERSION) {
		return
	}

	localStorage.removeItem(USER_STORAGE_KEY)
	localStorage.removeItem(ANONYMOUS_ID_STORAGE_KEY)
	localStorage.setItem(STATS_SCHEMA_VERSION_KEY, String(STATS_SCHEMA_VERSION))
}
