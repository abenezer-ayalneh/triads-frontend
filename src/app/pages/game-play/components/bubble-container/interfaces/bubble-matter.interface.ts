import Matter from 'matter-js'

export interface BubbleMatter {
	element: HTMLElement
	body: Matter.Body
	halfWidth: number
	halfHeight: number
	// Physics-driven shimmy parameters
	shimmyPhaseX?: number
	shimmyPhaseY?: number
	shimmyFreqX?: number // Hz
	shimmyFreqY?: number // Hz
	shimmyForceMag?: number // small force magnitude
}
