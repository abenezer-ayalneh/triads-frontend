export const WRONG_MESSAGES = ['Oops!', 'Nope', 'Incorrect', 'Missed it!', 'Try Again', 'Error']

export const GAME_END_MESSAGES_CLASSIC: Record<number, string> = {
	15: 'WOW! You did it! A perfect score!',
	12: 'Nice one! Think you can do even better?',
	10: 'Success! (but just barely). Want another try?',
	8: 'Close, but the last one got you. Try another?',
	6: 'That was a tough one. Ready to try again?',
	3: 'You can do better, give it another try.',
	0: "Try another? You'll get the hang of it.",
}

export const GAME_END_MESSAGES_DAILY: Record<number, string> = {
	15: 'WOW! You did it! A perfect score!',
	12: 'Excellent! Almost perfect',
	10: 'Whew! Success by a whisker.',
	8: '3 out of 4. Not bad.',
	6: 'That was a tricky one.',
	3: 'Some seem easy, but not this one.',
	0: 'That was tough! Try again tomorrow.',
}

export const GAME_END_MESSAGES_REVIEW: Record<number, string> = {
	15: 'You did it! A perfect score!',
	12: 'Excellent! Near perfect!',
	10: 'Success by a whisker.',
	8: '3 out of 4. Not bad!',
	6: 'Close, but no cigar.',
	3: 'Tough one. Keep at it!',
	0: 'Better luck tomorrow.',
}
