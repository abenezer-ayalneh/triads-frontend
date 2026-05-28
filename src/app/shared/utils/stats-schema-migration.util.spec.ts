import { STATS_SCHEMA_VERSION, STATS_SCHEMA_VERSION_KEY } from '../constants/global.constant'
import { getStoredStatsSchemaVersion, runStatsSchemaMigrationIfNeeded } from './stats-schema-migration.util'

describe('stats-schema-migration.util', () => {
	beforeEach(() => {
		localStorage.clear()
	})

	it('defaults stored schema version to 1 when missing', () => {
		expect(getStoredStatsSchemaVersion()).toBe(1)
	})

	it('wipes user and anonymous id once when schema version is behind', () => {
		localStorage.setItem('user', JSON.stringify({ username: 'TestUser', scores: { 15: 1 }, firstGameDate: '2026-01-01T00:00:00.000Z' }))
		localStorage.setItem('triads_anonymous_id', 'anon-123')

		runStatsSchemaMigrationIfNeeded()

		expect(localStorage.getItem('user')).toBeNull()
		expect(localStorage.getItem('triads_anonymous_id')).toBeNull()
		expect(localStorage.getItem(STATS_SCHEMA_VERSION_KEY)).toBe(String(STATS_SCHEMA_VERSION))
	})

	it('does not wipe storage after migration has already run', () => {
		localStorage.setItem(STATS_SCHEMA_VERSION_KEY, String(STATS_SCHEMA_VERSION))
		localStorage.setItem('user', JSON.stringify({ username: 'TestUser', scores: { 15: 1 }, firstGameDate: '2026-01-01T00:00:00.000Z' }))
		localStorage.setItem('triads_anonymous_id', 'anon-123')

		runStatsSchemaMigrationIfNeeded()

		expect(localStorage.getItem('user')).not.toBeNull()
		expect(localStorage.getItem('triads_anonymous_id')).toBe('anon-123')
	})
})
