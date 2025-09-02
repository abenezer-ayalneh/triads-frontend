export interface TriadResponse {
	id: number
	cues: string[]
}

export interface TriadGroupResponse {
	id: number
	triads: TriadResponse[]
}

export interface TriadsGroup {
	id: number
	triads: Triad[]
}

export interface Triad extends TriadResponse {
	available: boolean
}

export interface SolvedTriad extends TriadResponse {
	keyword: string
	fullPhrases: string[]
}
