export interface CueGroup {
	id: number
	commonWord: string
	cues: Cue[]
}

export interface Cue {
	id: number
	word: string
}
