export interface Bubble {
	id: number
	cueId: number
	cueWord: string
	commonWordId: number
	text: string
	color: string
	originalColor: string
	x: number
	y: number
	vx: number
	vy: number
	radius: number
	originalRadius: number // Store the original radius for deselection
	opacity: number
	isBursting: boolean
	isSelected: boolean
}
