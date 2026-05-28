import { extractClassicExtraQuota } from './classic-extra.util'

describe('classic-extra.util', () => {
	it('extracts classic quota fields from API payloads', () => {
		const quota = extractClassicExtraQuota({
			classicExtrasUsed: 1,
			classicExtrasRemaining: 2,
			classicExtrasLimit: 3,
			canPlayClassic: true,
			classicBlockedReason: null,
		})

		expect(quota).toEqual({
			classicExtrasUsed: 1,
			classicExtrasRemaining: 2,
			classicExtrasLimit: 3,
			canPlayClassic: true,
			classicBlockedReason: null,
		})
	})

	it('returns null when quota fields are incomplete', () => {
		expect(extractClassicExtraQuota({ classicExtrasUsed: 1 })).toBeNull()
	})
})
