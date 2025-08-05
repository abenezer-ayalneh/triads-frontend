import { CommonModule } from '@angular/common'
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, OnDestroy, OnInit } from '@angular/core'
import lottie, { AnimationItem } from 'lottie-web'

import { GlobalStore } from '../../state/global.store'
import { CueGroup } from '../game-play/interfaces/cue.interface'
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

	cueGroups = input.required<CueGroup[]>()

	selectedBubbleIds = computed(() => this.store.selectedBubbles().map((bubble) => bubble.id))

	readonly bubblesContainer = inject(ElementRef)

	private readonly gameWords = computed(() =>
		this.cueGroups()
			.map((cueGroup) => cueGroup.cues)
			.map((cue) => cue.map((cue) => cue.word))
			.flat(),
	)

	private animationFrameId: number | null = null

	private lottieAnimations: AnimationItem[] = []

	private resizeObserver: ResizeObserver | null = null

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

	ngOnInit(): void {
		this.initializeBubbles()
		this.startAnimation()
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

		const currentBubbles = this.store.bubbles()
		const selectedBubbles = this.store.selectedBubbles()
		const { width: containerWidth, height: containerHeight } = this.getContainerDimensions()

		const isChosenBubblesSelected = selectedBubbles.some((bubble) => bubble.id === chosenBubble.id)

		if (isChosenBubblesSelected) {
			// Deselect the bubble - return to original size
			const updatedBubbles = currentBubbles.map((bubble) =>
				bubble.id === chosenBubble.id
					? {
							...bubble,
							color: bubble.originalColor,
							radius: bubble.originalRadius, // Use the stored original radius
						}
					: bubble,
			)
			this.store.setBubbles(updatedBubbles)
			this.store.removeSelectedBubbles(chosenBubble)

			// Restart Lottie animation for deselected bubble
			if (this.lottieAnimations[chosenBubble.id]) {
				this.lottieAnimations[chosenBubble.id].play()
			}
		} else {
			// Check if we can select more bubbles (max 3)
			if (selectedBubbles.length >= 3) {
				return // Don't allow selection of 4th bubble
			}

			// Select the bubble - scale up by 50% with responsive scaling
			let maxRadius = Math.min(containerWidth, containerHeight) * 0.15
			if (containerWidth < 768) {
				maxRadius = Math.min(containerWidth, containerHeight) * 0.18 // Allow slightly larger on tablets
			}
			if (containerWidth < 480) {
				maxRadius = Math.min(containerWidth, containerHeight) * 0.2 // Allow even larger on mobile
			}

			// Calculate responsive scaling factor based on screen size
			let scaleFactor = 1.5 // Default 50% increase
			if (containerWidth < 768) {
				scaleFactor = 1.3 // 30% increase on tablets
			}
			if (containerWidth < 480) {
				scaleFactor = 1.75 // 20% increase on mobile
			}

			// Ensure the selected radius is at least 50% larger than original
			const minSelectedRadius = chosenBubble.originalRadius * 1.5
			const calculatedSelectedRadius = chosenBubble.originalRadius * scaleFactor
			const selectedRadius = Math.max(minSelectedRadius, Math.min(calculatedSelectedRadius, maxRadius))

			const updatedBubbles = currentBubbles.map((bubble) =>
				bubble.id === chosenBubble.id
					? {
							...bubble,
							color: '#FFFFFF', // White background
							radius: selectedRadius,
						}
					: bubble,
			)
			this.store.setBubbles(updatedBubbles)
			this.store.addSelectedBubbles(chosenBubble)

			// Pause Lottie animation for selected bubble
			if (this.lottieAnimations[chosenBubble.id]) {
				this.lottieAnimations[chosenBubble.id].pause()
			}
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

		// Diamond structure positions (9 bubbles in a diamond pattern)
		const centerX = containerWidth / 2
		const centerY = containerHeight / 2
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

		this.cueGroups().forEach((cueGroup, index) => {
			cueGroup.cues.forEach((cue) => {
				if (index < adjustedPositions.length) {
					newBubbles.push({
						id: cue.id,
						cueId: cue.id,
						cueWord: cue.word,
						commonWordId: cueGroup.id,
						text: cue.word,
						color: this.bubbleColors[index],
						originalColor: this.bubbleColors[index],
						x: adjustedPositions[index].x,
						y: adjustedPositions[index].y,
						vx: (Math.random() - 0.5) * 0.8, // Reduced speed
						vy: (Math.random() - 0.5) * 0.8, // Reduced speed
						radius: uniformRadius,
						originalRadius: uniformRadius, // Store the original radius
						opacity: 1,
						isBursting: false,
					})
				}
			})
		})

		this.store.setBubbles(newBubbles)
	}

	private startAnimation(): void {
		const animate = () => {
			this.updateBubbles()
			this.animationFrameId = requestAnimationFrame(animate)
		}
		animate()
	}

	private updateBubbles(): void {
		const currentBubbles = this.store.bubbles()
		const { width: containerWidth, height: containerHeight } = this.getContainerDimensions()
		const selectedBubblesIds = this.store.selectedBubbles().map((bubble) => bubble.id)

		const updatedBubbles = currentBubbles.map((bubble) => {
			if (bubble.isBursting) {
				return bubble
			}

			if (selectedBubblesIds.includes(bubble.id)) {
				return bubble // Selected bubbles don't move
			}

			// Update position
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

		this.store.setBubbles(bubblesWithRestoration)
	}

	private restoreDiamondStructure(bubbles: Bubble[], containerWidth: number, containerHeight: number): Bubble[] {
		const centerX = containerWidth / 2
		const centerY = containerHeight / 2
		const uniformRadius = bubbles[0]?.radius || 60
		const selectedBubblesIds = this.store.selectedBubbles().map((bubble) => bubble.id)

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

		for (let i = 0; i < updatedBubbles.length; i++) {
			const bubble1 = updatedBubbles[i]

			// Skip bursting bubbles
			if (bubble1.isBursting) continue

			for (let j = i + 1; j < updatedBubbles.length; j++) {
				const bubble2 = updatedBubbles[j]

				// Skip bursting bubbles
				if (bubble2.isBursting) continue

				// Skip if both bubbles are selected (selected bubbles can't collide with each other)
				if ([bubble1.id, bubble2.id].every((bubbleId) => this.selectedBubbleIds().includes(bubbleId))) {
					continue
				}

				// Calculate distance between bubble centers
				const dx = bubble2.x - bubble1.x
				const dy = bubble2.y - bubble1.y
				const distance = Math.sqrt(dx * dx + dy * dy)
				const minDistance = bubble1.radius + bubble2.radius + 10 // Add extra padding to prevent overlap

				// Check if bubbles are colliding
				if (distance < minDistance) {
					// Calculate collision response
					const angle = Math.atan2(dy, dx)
					const sin = Math.sin(angle)
					const cos = Math.cos(angle)

					// Rotate velocities
					const vx1 = bubble1.vx * cos + bubble1.vy * sin
					const vy1 = bubble1.vy * cos - bubble1.vx * sin
					const vx2 = bubble2.vx * cos + bubble2.vy * sin
					const vy2 = bubble2.vy * cos - bubble2.vx * sin

					// Swap the rotated velocities (elastic collision)
					const tempVx = vx1

					// Apply stronger damping to prevent excessive bouncing
					const damping = 0.6

					// Update velocities with damping
					// If bubble1 is selected, only update bubble2's velocity
					if (!this.selectedBubbleIds().includes(bubble1.id)) {
						updatedBubbles[i] = {
							...bubble1,
							vx: (vx2 * cos - vy1 * sin) * damping,
							vy: (vy1 * cos + vx2 * sin) * damping,
						}
					}

					// If bubble2 is selected, only update bubble1's velocity
					if (!this.selectedBubbleIds().includes(bubble2.id)) {
						updatedBubbles[j] = {
							...bubble2,
							vx: (tempVx * cos - vy2 * sin) * damping,
							vy: (vy2 * cos + tempVx * sin) * damping,
						}
					}

					// Separate bubbles to prevent sticking with more aggressive separation
					const overlap = minDistance - distance
					const separationX = (overlap * dx) / distance
					const separationY = (overlap * dy) / distance

					// Only move non-selected bubbles
					if (!this.selectedBubbleIds().includes(bubble1.id)) {
						updatedBubbles[i] = {
							...updatedBubbles[i],
							x: bubble1.x - separationX * 0.6,
							y: bubble1.y - separationY * 0.6,
						}
					}

					if (!this.selectedBubbleIds().includes(bubble2.id)) {
						updatedBubbles[j] = {
							...updatedBubbles[j],
							x: bubble2.x + separationX * 0.6,
							y: bubble2.y + separationY * 0.6,
						}
					}
				}
			}
		}

		return updatedBubbles
	}
}
