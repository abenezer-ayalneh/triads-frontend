export interface User {
	username: string
	scores: Record<number, number> // Key is any one of the scores (15|12|10|8|6|3|0), values is the number of games won with that score
	firstGameDate: string | null // ISO date string for the first game played
}
