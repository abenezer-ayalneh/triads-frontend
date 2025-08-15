export interface CueGroup {
	id: number
	commonWord: string
	available: boolean
	cues: Cue[]
}

export interface Cue {
	id: number
	word: string
	fullWord: string
}
