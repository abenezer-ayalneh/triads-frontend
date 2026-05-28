import { ClassicBlockedReason,ClassicExtraQuotaInfo } from '../interfaces/classic-extra.interface'

export function isClassicExtraQuotaInfo(value: unknown): value is ClassicExtraQuotaInfo {
	if (!value || typeof value !== 'object') {
		return false
	}

	const quota = value as ClassicExtraQuotaInfo
	return (
		typeof quota.classicExtrasUsed === 'number' &&
		typeof quota.classicExtrasRemaining === 'number' &&
		typeof quota.classicExtrasLimit === 'number' &&
		typeof quota.canPlayClassic === 'boolean' &&
		(quota.classicBlockedReason === null || quota.classicBlockedReason === 'daily_required' || quota.classicBlockedReason === 'capacity_reached')
	)
}

export function extractClassicExtraQuota(source: unknown): ClassicExtraQuotaInfo | null {
	if (!source || typeof source !== 'object') {
		return null
	}

	const record = source as Record<string, unknown>
	if (!isClassicExtraQuotaInfo(record)) {
		return null
	}

	return {
		classicExtrasUsed: record.classicExtrasUsed,
		classicExtrasRemaining: record.classicExtrasRemaining,
		classicExtrasLimit: record.classicExtrasLimit,
		canPlayClassic: record.canPlayClassic,
		classicBlockedReason: record.classicBlockedReason as ClassicBlockedReason,
	}
}

export function formatClassicRemainingLabel(remaining: number): string {
	return ` · ${remaining} left today`
}
