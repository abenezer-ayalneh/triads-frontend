export const AVAILABLE_SCORE_GIFS = [0, 3, 6, 8, 10, 12, 15] as const

export const SCORE_GIF_BASE_PATH = '/images/score-gifs/'
export const SCORE_PNG_BASE_PATH = '/images/score-pngs/'
export const READY_TO_PLAY_LABEL = 'Ready to play?'

export function getScoreGifFilename(score: number): string {
	const validScores = [...AVAILABLE_SCORE_GIFS]
	const nearestScore = validScores.find((availableScore) => availableScore >= score) ?? validScores[validScores.length - 1]

	return `score-${nearestScore}.gif`
}

export function getScoreGifPath(score: number): string {
	return `${SCORE_GIF_BASE_PATH}${getScoreGifFilename(score)}`
}

export function getScorePngPath(score: number): string {
	const validScores = [...AVAILABLE_SCORE_GIFS]
	const nearestScore = validScores.find((availableScore) => availableScore >= score) ?? validScores[validScores.length - 1]

	return `${SCORE_PNG_BASE_PATH}score-${nearestScore}.png`
}
