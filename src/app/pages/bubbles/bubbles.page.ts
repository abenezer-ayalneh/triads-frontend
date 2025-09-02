import { CommonModule } from '@angular/common'
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	ElementRef,
	HostListener,
	inject,
	input,
	OnDestroy,
	OnInit,
	signal,
} from '@angular/core'
import lottie, { AnimationItem } from 'lottie-web'

import { GlobalStore } from '../../state/global.store'
import { TriadsGroup } from '../game-play/interfaces/triad.interface'
import { Bubble } from './interfaces/bubble.interface'

@Component({
	selector: 'app-bubbles-page',
	imports: [CommonModule],
	templateUrl: './bubbles.page.html',
	styleUrl: './bubbles.page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BubblesPage implements OnInit, OnDestroy, AfterViewInit {
	readonly store = inject(GlobalStore)

	cueGroups = input.required<TriadsGroup[]>()

	bubbles = signal<Bubble[]>([])

	selectedBubbleIds = computed(() => this.store.selectedCues().map((bubble) => bubble.id))

	readonly bubblesContainer = inject(ElementRef)

	// Collected KEY words area (bottom stack)
	collectedKeys = signal<{ id: number; text: string }[]>([])

	private readonly gameWords = computed(() =>
		this.cueGroups()
			.map((cueGroup) => cueGroup.triads)
			.map((cue) => cue.map((cue) => cue.word))
			.flat(),
	)

	private animationFrameId: number | null = null

	private lottieAnimations: AnimationItem[] = []

	private resizeObserver: ResizeObserver | null = null

	private popAudio: HTMLAudioElement | null = typeof Audio !== 'undefined' ? new Audio('/sounds/pop.mp3') : null

	private readonly bubbleColors = [
		'#D4A574', // light brown/bronze
		'#B8C5D1', // light gray-blue
		'#FF69B4', // vibrant pink
		'#90EE90', // light green
		'#FF6B8A', // reddish-pink
		'#696969', // dark gray
		'#FFA500', // bright orange
		'#696969', // dark gray
		'#556B2F', // dark green-gray
	]

	private resizeTimeout: ReturnType<typeof setTimeout> | undefined = undefined

	private collectedGroupIds = new Set<number>()

	ngOnInit(): void {
		this.initializeBubbles()
		this.startAnimation()

		// Re-initialize when cue groups change (e.g., switch to final challenge)
		effect(() => {
			// Track IDs to detect a change without triggering excessive work
			const ids = this.cueGroups()
				.map((g) => [g.id, g.available, g.triads.map((c) => c.id).join('-')].join(':'))
				.join('|')
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			ids
			this.initializeBubbles()
		})

		// When a triad is solved, capture its KEY into collection
		effect(() => {
			const state = this.store.gamePlayState()
			if (state === 'CORRECT_ANSWER') {
				const selected = this.store.selectedCues()
				if (selected.length === 3) {
					const groups = this.store.cueGroups()
					const sampleId = selected[0].id
					const group = groups.find((g) => g.cues.map((c) => c.id).includes(sampleId))
					if (group && !this.collectedGroupIds.has(group.id)) {
						this.collectedGroupIds.add(group.id)
						this.collectedKeys.update((arr) => [...arr, { id: group.id, text: group.commonWord }])
					}
				}
			}
		})
	}

	ngAfterViewInit(): void {
		this.initializeLottieAnimations()
		this.setupResizeObserver()
	}

	@HostListener('window:resize')
	onResize(): void {
		// Debounce resize events to avoid excessive reinitialization
		clearTimeout(this.resizeTimeout)
		this.resizeTimeout = setTimeout(() => {
			this.initializeBubbles()
		}, 250)
	}

	ngOnDestroy(): void {
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId)
		}
		// Clean up resize timeout
		if (this.resizeTimeout) {
			clearTimeout(this.resizeTimeout)
		}
		// Clean up resize observer
		if (this.resizeObserver) {
			this.resizeObserver.disconnect()
		}
		// Clean up Lottie animations
		this.lottieAnimations.forEach((anim) => {
			if (anim) {
				anim.destroy()
			}
		})
	}

	onBubbleClick(chosenBubble: Bubble): void {
		if (chosenBubble.isBursting) return

		const currentBubbles = this.bubbles()
		const selectedCues = this.store.selectedCues()

		const isChosenBubblesSelected = selectedCues.some((bubble) => bubble.id === chosenBubble.id)

		if (isChosenBubblesSelected) {
			// Deselect the bubble
			this.bubbles.set(currentBubbles)
			this.store.removeSelectedCue({ id: chosenBubble.cueId, word: chosenBubble.cueWord })
		} else {
			// Check if we can select more bubbles (max 3)
			if (selectedCues.length >= 3) {
				return // Don't allow selection of 4th bubble
			}
			// Select the bubble (no scaling or color changes)
			this.bubbles.set(currentBubbles)
			this.store.addSelectedCue({ id: chosenBubble.cueId, word: chosenBubble.cueWord })
		}
	}

	getBubbleStyle(bubble: Bubble): Record<string, string> {
		return {
			left: `${bubble.x - bubble.radius}px`,
			top: `${bubble.y - bubble.radius}px`,
			width: `${bubble.radius * 2}px`,
			height: `${bubble.radius * 2}px`,
			opacity: bubble.opacity.toString(),
			transition: 'all 0.2s ease',
		}
	}

	private setupResizeObserver(): void {
		if (this.bubblesContainer.nativeElement && 'ResizeObserver' in window) {
			this.resizeObserver = new ResizeObserver(() => {
				// Debounce resize observer events
				clearTimeout(this.resizeTimeout)
				this.resizeTimeout = setTimeout(() => {
					this.initializeBubbles()
				}, 250)
			})
			this.resizeObserver.observe(this.bubblesContainer.nativeElement)
		}
	}

	private getContainerDimensions(): { width: number; height: number } {
		if (this.bubblesContainer.nativeElement) {
			const rect = this.bubblesContainer.nativeElement.getBoundingClientRect()
			return {
				width: rect.width,
				height: rect.height,
			}
		}
		// Fallback to window dimensions if container not available
		return {
			width: window.innerWidth,
			height: window.innerHeight,
		}
	}

	private initializeBubbles(): void {
		const newBubbles: Bubble[] = []
		const { width: containerWidth, height: containerHeight } = this.getContainerDimensions()

		// Calculate optimal bubble size based on container dimensions
		const containerArea = containerWidth * containerHeight
		const maxBubbles = 9
		const minBubbles = 3
		const avgBubbles = (maxBubbles + minBubbles) / 2 // 6 bubbles average
		const availableAreaPerBubble = containerArea / avgBubbles
		const baseRadius = Math.sqrt(availableAreaPerBubble / Math.PI) * 0.15 // 15% of available area

		// Find the largest possible size for all bubbles with responsive sizing
		let maxRadius = 0
		this.gameWords().forEach((word) => {
			const textLength = word.length
			// Adjust text radius calculation based on screen size
			let textRadius = Math.max(60, textLength * 10)
			if (containerWidth < 768) {
				textRadius = Math.max(50, textLength * 8) // Smaller on tablets
			}
			if (containerWidth < 480) {
				textRadius = Math.max(40, textLength * 6) // Even smaller on mobile
			}
			const finalRadius = Math.max(baseRadius, textRadius)
			maxRadius = Math.max(maxRadius, finalRadius)
		})

		// Constrain to container bounds with responsive limits
		let containerMaxRadius = Math.min(containerWidth, containerHeight) * 0.15
		if (containerWidth < 768) {
			containerMaxRadius = Math.min(containerWidth, containerHeight) * 0.18 // Allow slightly larger on tablets
		}
		if (containerWidth < 480) {
			containerMaxRadius = Math.min(containerWidth, containerHeight) * 0.2 // Allow even larger on mobile
		}
		const uniformRadius = Math.min(maxRadius, containerMaxRadius)

		// Scale bubbles to be 1.5x larger (half of previous 3x) while staying responsive and within container
		let containerMaxRadiusLarge = Math.min(containerWidth, containerHeight) * 0.18
		if (containerWidth < 768) {
			containerMaxRadiusLarge = Math.min(containerWidth, containerHeight) * 0.22
		}
		if (containerWidth < 480) {
			containerMaxRadiusLarge = Math.min(containerWidth, containerHeight) * 0.26
		}
		const scaledRadius = Math.min(uniformRadius * 1.5, containerMaxRadiusLarge)

		// Diamond structure positions (9 bubbles in a diamond pattern)
		const centerX = containerWidth / 2
		const centerY = containerHeight / 2
		const diamondPositions = [
			// Top
			{ x: centerX, y: centerY - scaledRadius * 2.5 },
			// Second row (left and right)
			{ x: centerX - scaledRadius * 2, y: centerY - scaledRadius * 1.5 },
			{ x: centerX + scaledRadius * 2, y: centerY - scaledRadius * 1.5 },
			// Third row (left, center, right)
			{ x: centerX - scaledRadius * 2, y: centerY },
			{ x: centerX, y: centerY },
			{ x: centerX + scaledRadius * 2, y: centerY },
			// Fourth row (left and right)
			{ x: centerX - scaledRadius * 2, y: centerY + scaledRadius * 1.5 },
			{ x: centerX + scaledRadius * 2, y: centerY + scaledRadius * 1.5 },
			// Bottom
			{ x: centerX, y: centerY + scaledRadius * 2.5 },
		]

		// Ensure positions are within container bounds
		const adjustedPositions = diamondPositions.map((pos) => ({
			x: Math.max(scaledRadius, Math.min(containerWidth - scaledRadius, pos.x)),
			y: Math.max(scaledRadius, Math.min(containerHeight - scaledRadius, pos.y)),
		}))

		const initialPhaseGroups = this.cueGroups().filter((g) => g.available)
		const isFinalPhase = initialPhaseGroups.length === 0

		let positionIndex = 0
		this.cueGroups().forEach((cueGroup) => {
			cueGroup.triads.forEach((cue) => {
				if (positionIndex < adjustedPositions.length) {
					// Start position: from random bottom in initial phase, from collection area in final phase
					let startX = Math.random() * containerWidth
					let startY = containerHeight + scaledRadius
					if (isFinalPhase && this.collectedKeys().length >= 3) {
						const slot = Math.min(positionIndex, 2)
						const spacing = containerWidth / 4
						startX = spacing * (slot + 1)
						startY = containerHeight - scaledRadius * 0.5
					}
					const targetPos = adjustedPositions[positionIndex]
					const colorIndex = positionIndex % this.bubbleColors.length
					newBubbles.push({
						id: cue.id,
						cueId: cue.id,
						cueWord: cue.word,
						commonWordId: cueGroup.id,
						text: cue.word,
						color: this.bubbleColors[colorIndex],
						originalColor: this.bubbleColors[colorIndex],
						x: startX,
						y: startY,
						entryTargetX: targetPos.x,
						entryTargetY: targetPos.y,
						vx: (Math.random() - 0.5) * 0.5, // Slower speed to reduce collisions
						vy: (Math.random() - 0.5) * 0.5, // Slower speed to reduce collisions
						radius: scaledRadius,
						originalRadius: scaledRadius, // Store the original radius
						opacity: 1,
						isBursting: false,
					})
					positionIndex += 1
				}
			})
		})

		this.bubbles.set(newBubbles)
	}

	private startAnimation(): void {
		const animate = () => {
			this.updateBubbles()
			this.animationFrameId = requestAnimationFrame(animate)
		}
		animate()
	}

	private updateBubbles(): void {
		const currentBubbles = this.bubbles()
		const { width: containerWidth, height: containerHeight } = this.getContainerDimensions()
		const selectedBubblesIds = this.store.selectedCues().map((bubble) => bubble.id)

		const gameState = this.store.gamePlayState()
		const updatedBubbles = currentBubbles.map((bubble) => {
			if (bubble.isBursting) {
				// Simple fade-out for burst; can be replaced by sprite animation
				const newOpacity = Math.max(0, bubble.opacity - 0.06)
				return { ...bubble, opacity: newOpacity }
			}

			// Trigger burst when answer is correct
			if (gameState === 'CORRECT_ANSWER' && selectedBubblesIds.includes(bubble.id)) {
				// Play pop sound once
				this.popAudio?.play()
				return { ...bubble, isBursting: true, burstProgress: 0 }
			}

			if (selectedBubblesIds.includes(bubble.id)) {
				return bubble // Selected bubbles don't move
			}

			// Entry rise: move towards entryTarget if set
			if (typeof bubble.entryTargetX === 'number' && typeof bubble.entryTargetY === 'number') {
				const dx = bubble.entryTargetX - bubble.x
				const dy = bubble.entryTargetY - bubble.y
				const dist = Math.sqrt(dx * dx + dy * dy)
				const step = Math.max(1, Math.min(6, dist * 0.06))
				if (dist > 1) {
					const nx = bubble.x + (dx / dist) * step
					const ny = bubble.y + (dy / dist) * step
					return { ...bubble, x: nx, y: ny }
				} else {
					// Reached target, clear entry targets
					return bubble
				}
			}

			// Update position (ambient motion)
			let newX = bubble.x + bubble.vx
			let newY = bubble.y + bubble.vy

			// Bounce off container walls
			if (newX - bubble.radius <= 0 || newX + bubble.radius >= containerWidth) {
				bubble.vx = -bubble.vx
				newX = bubble.x + bubble.vx
			}
			if (newY - bubble.radius <= 0 || newY + bubble.radius >= containerHeight) {
				bubble.vy = -bubble.vy
				newY = bubble.y + bubble.vy
			}

			// Ensure bubble stays within container bounds
			newX = Math.max(bubble.radius, Math.min(containerWidth - bubble.radius, newX))
			newY = Math.max(bubble.radius, Math.min(containerHeight - bubble.radius, newY))

			return {
				...bubble,
				x: newX,
				y: newY,
			}
		})

		// Check for collisions
		const bubblesWithCollisions = this.checkCollisions(updatedBubbles)

		// Apply gentle restoration to diamond structure
		const bubblesWithRestoration = this.restoreDiamondStructure(bubblesWithCollisions, containerWidth, containerHeight)

		// Remove fully faded burst bubbles
		const remaining = bubblesWithRestoration.filter((b) => b.opacity > 0.01)
		this.bubbles.set(remaining)
	}

	private restoreDiamondStructure(bubbles: Bubble[], containerWidth: number, containerHeight: number): Bubble[] {
		const centerX = containerWidth / 2
		const centerY = containerHeight / 2
		const uniformRadius = bubbles[0]?.radius || 60
		const selectedBubblesIds = this.store.selectedCues().map((bubble) => bubble.id)

		// Diamond structure positions
		const diamondPositions = [
			// Top
			{ x: centerX, y: centerY - uniformRadius * 2.5 },
			// Second row (left and right)
			{ x: centerX - uniformRadius * 2, y: centerY - uniformRadius * 1.5 },
			{ x: centerX + uniformRadius * 2, y: centerY - uniformRadius * 1.5 },
			// Third row (left, center, right)
			{ x: centerX - uniformRadius * 2, y: centerY },
			{ x: centerX, y: centerY },
			{ x: centerX + uniformRadius * 2, y: centerY },
			// Fourth row (left and right)
			{ x: centerX - uniformRadius * 2, y: centerY + uniformRadius * 1.5 },
			{ x: centerX + uniformRadius * 2, y: centerY + uniformRadius * 1.5 },
			// Bottom
			{ x: centerX, y: centerY + uniformRadius * 2.5 },
		]

		// Ensure positions are within container bounds
		const adjustedPositions = diamondPositions.map((pos) => ({
			x: Math.max(uniformRadius, Math.min(containerWidth - uniformRadius, pos.x)),
			y: Math.max(uniformRadius, Math.min(containerHeight - uniformRadius, pos.y)),
		}))

		return bubbles.map((bubble, index) => {
			if (selectedBubblesIds.includes(bubble.id) || bubble.isBursting || index >= adjustedPositions.length) {
				return bubble
			}

			// Calculate distance from ideal position
			const idealPos = adjustedPositions[index]
			const dx = idealPos.x - bubble.x
			const dy = idealPos.y - bubble.y
			const distance = Math.sqrt(dx * dx + dy * dy)

			// If bubble is too far from ideal position, gently pull it back
			if (distance > uniformRadius * 0.5) {
				const pullStrength = 0.02 // Very gentle pull
				const newX = bubble.x + dx * pullStrength
				const newY = bubble.y + dy * pullStrength

				return {
					...bubble,
					x: newX,
					y: newY,
				}
			}

			return bubble
		})
	}

	private initializeLottieAnimations(): void {
		// Initialize Lottie animations for each bubble
		setTimeout(() => {
			const bubbleElements = document.querySelectorAll('.game-bubble')
			bubbleElements.forEach((element, index) => {
				const lottieContainer = element.querySelector('.lottie-container') as HTMLElement
				if (lottieContainer) {
					this.lottieAnimations[index] = lottie.loadAnimation({
						container: lottieContainer,
						renderer: 'svg',
						loop: true,
						autoplay: true,
						path: '/lotties/bubble-lottie.json',
					})
				}
			})
		}, 100)
	}

	private checkCollisions(bubbles: Bubble[]): Bubble[] {
		const updatedBubbles = [...bubbles]
		const { width: containerWidth, height: containerHeight } = this.getContainerDimensions()

		for (let i = 0; i < updatedBubbles.length; i++) {
			const bubbleA = updatedBubbles[i]

			if (bubbleA.isBursting) continue

			for (let j = i + 1; j < updatedBubbles.length; j++) {
				const bubbleB = updatedBubbles[j]

				if (bubbleB.isBursting) continue

				// If both are selected, do not attempt to move them
				const aSelected = this.selectedBubbleIds().includes(bubbleA.id)
				const bSelected = this.selectedBubbleIds().includes(bubbleB.id)
				if (aSelected && bSelected) continue

				const dx = bubbleB.x - bubbleA.x
				const dy = bubbleB.y - bubbleA.y
				const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001
				const minDistance = bubbleA.radius + bubbleB.radius + 8 // padding to prevent any visual overlap

				if (distance < minDistance) {
					// Normalized direction from A to B
					const nx = dx / distance
					const ny = dy / distance
					const overlap = minDistance - distance

					// How much to move each bubble
					let moveAX = 0
					let moveAY = 0
					let moveBX = 0
					let moveBY = 0

					if (aSelected && !bSelected) {
						// Move only B fully away from A
						moveBX = nx * overlap
						moveBY = ny * overlap
					} else if (!aSelected && bSelected) {
						// Move only A fully away from B
						moveAX = -nx * overlap
						moveAY = -ny * overlap
					} else {
						// Neither selected: split the correction evenly
						moveAX = -(nx * overlap) / 2
						moveAY = -(ny * overlap) / 2
						moveBX = (nx * overlap) / 2
						moveBY = (ny * overlap) / 2
					}

					// Apply movement
					if (!aSelected) {
						const newAX = Math.max(bubbleA.radius, Math.min(containerWidth - bubbleA.radius, bubbleA.x + moveAX))
						const newAY = Math.max(bubbleA.radius, Math.min(containerHeight - bubbleA.radius, bubbleA.y + moveAY))
						updatedBubbles[i] = { ...updatedBubbles[i], x: newAX, y: newAY }
					}

					if (!bSelected) {
						const newBX = Math.max(bubbleB.radius, Math.min(containerWidth - bubbleB.radius, bubbleB.x + moveBX))
						const newBY = Math.max(bubbleB.radius, Math.min(containerHeight - bubbleB.radius, bubbleB.y + moveBY))
						updatedBubbles[j] = { ...updatedBubbles[j], x: newBX, y: newBY }
					}

					// Lightly damp velocities to reduce jittering
					const damping = 0.85
					if (!aSelected) {
						updatedBubbles[i] = { ...updatedBubbles[i], vx: updatedBubbles[i].vx * damping, vy: updatedBubbles[i].vy * damping }
					}
					if (!bSelected) {
						updatedBubbles[j] = { ...updatedBubbles[j], vx: updatedBubbles[j].vx * damping, vy: updatedBubbles[j].vy * damping }
					}
				}
			}
		}

		return updatedBubbles
	}
}
