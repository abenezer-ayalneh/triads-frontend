export interface TriadItem {
	id: number
	keyword: string
	cues: string[]
	fullPhrases: string[]
}

export interface TriadGroup {
	id: number
	active: boolean
	triad1: TriadItem
	triad2: TriadItem
	triad3: TriadItem
	triad4: TriadItem
}

export interface TriadGroupResponse {
	id: number
	active: boolean
	triad1: TriadItem
	triad2: TriadItem
	triad3: TriadItem
	triad4: TriadItem
}

export interface TriadGroupFormData {
	triad1: {
		keyword: string
		fullPhrases: [string, string, string]
	}
	triad2: {
		keyword: string
		fullPhrases: [string, string, string]
	}
	triad3: {
		keyword: string
		fullPhrases: [string, string, string]
	}
	triad4: {
		keyword: string
		fullPhrases: [string, string, string]
	}
}
