export type ClassicBlockedReason = 'daily_required' | 'capacity_reached' | null

export interface ClassicExtraQuotaInfo {
	classicExtrasUsed: number
	classicExtrasRemaining: number
	classicExtrasLimit: number
	canPlayClassic: boolean
	classicBlockedReason: ClassicBlockedReason
}
