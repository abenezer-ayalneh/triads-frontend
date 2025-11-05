import { AfterViewInit, Component, effect, ElementRef, inject, input, OnDestroy, viewChild, viewChildren } from '@angular/core'
import Matter from 'matter-js'

import { GlobalStore } from '../../state/global.store'
import { Bubble } from '../bubble/bubble'
import { BubbleMatter } from './interfaces/bubble-matter.interface'

@Component({
	selector: 'app-bubble-container',
	imports: [Bubble],
	templateUrl: './bubble-container.html',
	styleUrl: './bubble-container.scss',
})
export class BubbleContainer implements AfterViewInit, OnDestroy {
	readonly store = inject(GlobalStore)

	cues = input.required<string[] | null>()

	bubbleComponents = viewChildren<Bubble>('initialTriadBubble')

	finalTriadCuesBubbleComponents = viewChildren<Bubble>('finalTriadCuesBubble')

	container = viewChild.required<ElementRef<HTMLDivElement>>('container')

	engine: Matter.Engine

	entities: BubbleMatter[] = []

	private render?: Matter.Render

	private runner?: Matter.Runner

	private resizeObserver?: ResizeObserver

	private resizeDebounceTimer?: ReturnType<typeof setTimeout>

	private windowResizeListener?: () => void

	// Properties for sequential bubble creation
	private bubbleCreationQueue: Bubble[] = []

	private bubbleCreationInterval: ReturnType<typeof setInterval> | undefined

	private bubbleCreationDelay = 1100 // milliseconds between each bubble creation (75% slower than before)

	private nextBubbleSide: 'left' | 'right' = 'left' // Track which side to spawn next bubble from

	private gravitationalCenter: { x: number; y: number } = { x: 0, y: 0 }

	private boundaryWalls: Matter.Body[] = []

	constructor() {
		this.engine = Matter.Engine.create({
			gravity: { x: 0, y: 0, scale: 0 },
		})

		// Add collision detection between bubbles
		Matter.Events.on(this.engine, 'collisionStart', (event) => {
			const pairs = event.pairs
			pairs.forEach((pair) => {
				const { bodyA, bodyB } = pair
				// Check if both bodies are bubbles (not walls)
				if (this.isBubbleBody(bodyA) && this.isBubbleBody(bodyB)) {
					this.handleBubbleCollision(bodyA, bodyB)
				}
			})
		})

		effect(() => {
			const finalTriadCuesReached = this.store.triadsStep() === 'FINAL'

			if (finalTriadCuesReached && this.finalTriadCuesBubbleComponents().length === 3) {
				this.animateFinalTriadCues()
			}
		})

		// Watch for changes in cues to trigger rearrangement
		effect(() => {
			const currentCues = this.cues()
			if (currentCues) {
				// Check if any bubbles need to be hidden (removed from game)
				this.checkForRemovedBubbles()
			}
		})
	}

	ngAfterViewInit() {
		// Start sequential bubble creation
		this.startSequentialBubbleCreation(this.bubbleComponents())
	}

	createBodies(bubbleComponents: readonly Bubble[]) {
		// Use our sequential creation method instead
		this.startSequentialBubbleCreation(bubbleComponents)
	}

	ngOnDestroy(): void {
		// Clear the bubble creation interval
		if (this.bubbleCreationInterval) {
			clearInterval(this.bubbleCreationInterval)
			this.bubbleCreationInterval = undefined
		}

		if (this.resizeDebounceTimer) {
			clearTimeout(this.resizeDebounceTimer)
			this.resizeDebounceTimer = undefined
		}

		if (this.windowResizeListener) {
			window.removeEventListener('resize', this.windowResizeListener)
			this.windowResizeListener = undefined
		}

		if (this.resizeObserver) {
			this.resizeObserver.disconnect()
			this.resizeObserver = undefined
		}
		if (this.runner) {
			Matter.Runner.stop(this.runner)
			this.runner = undefined
		}
		if (this.render) {
			Matter.Render.stop(this.render)
			// Matter.Render.clear(this.render) // optional
			this.render.canvas.width = 0
			this.render.canvas.height = 0
			this.render = undefined
		}
	}

	runSimulation() {
		const update = () => {
			Matter.Engine.update(this.engine, 1000 / 60) // 60 FPS

			// Get container dimensions for calculations
			const container = this.container().nativeElement
			const width = container.clientWidth || container.offsetWidth || 0
			const height = container.clientHeight || container.offsetHeight || 0

			const now = performance.now() / 1000 // seconds
			this.entities.forEach(({ body, element, shimmyFreqX, shimmyFreqY, shimmyPhaseX, shimmyPhaseY, shimmyForceMag }) => {
				const { x, y } = body.position

				// Check if this is a final triad bubble (by checking if it has the finalTriadCuesBubble attribute)
				const isFinalTriadBubble = element.hasAttribute('finalTriadCuesBubble')

				// Special handling for final triad bubbles - keep them contained
				if (isFinalTriadBubble) {
					// Check if bubble is getting too close to any wall and apply containment force
					const centerX = width / 2
					const centerY = height / 2

					// Calculate distance from center
					const dx = x - centerX
					const dy = y - centerY
					const distance = Math.sqrt(dx * dx + dy * dy)

					// If bubble is getting too far from center, apply force toward center
					const maxAllowedDistance = Math.min(width, height) * 0.4 // 40% of container size
					if (distance > maxAllowedDistance) {
						const containmentForce = 0.0005 * (distance / maxAllowedDistance - 1)
						const forceX = (-dx / distance) * containmentForce
						const forceY = (-dy / distance) * containmentForce
						Matter.Body.applyForce(body, { x, y }, { x: forceX, y: forceY })
					}

					// Also apply a small continuous force toward center
					const gentleCenteringForce = 0.00005
					const gentleForceX = (-dx / distance) * gentleCenteringForce
					const gentleForceY = (-dy / distance) * gentleCenteringForce
					Matter.Body.applyForce(body, { x, y }, { x: gentleForceX, y: gentleForceY })

					// Limit maximum velocity to prevent escaping
					const maxVelocity = 2
					const velocity = body.velocity
					const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
					if (speed > maxVelocity) {
						Matter.Body.setVelocity(body, {
							x: (velocity.x * maxVelocity) / speed,
							y: (velocity.y * maxVelocity) / speed,
						})
					}
				}
				// Apply gravitational pull toward center for normal bubbles
				else {
					const dx = this.gravitationalCenter.x - x
					const dy = this.gravitationalCenter.y - y
					const distance = Math.sqrt(dx * dx + dy * dy)

					if (distance > 0) {
						// Very small gravitational force
						const gravitationalForce = 0.0001
						const forceX = (dx / distance) * gravitationalForce
						const forceY = (dy / distance) * gravitationalForce
						Matter.Body.applyForce(body, { x, y }, { x: forceX, y: forceY })
					}
				}

				// Apply tiny sinusoidal forces for subtle drift
				if (shimmyFreqX && shimmyPhaseX && shimmyForceMag) {
					const fx = Math.sin(2 * Math.PI * shimmyFreqX * now + shimmyPhaseX) * shimmyForceMag
					Matter.Body.applyForce(body, { x, y }, { x: fx, y: 0 })
				}
				if (shimmyFreqY && shimmyPhaseY && shimmyForceMag) {
					const fy = Math.cos(2 * Math.PI * shimmyFreqY * now + shimmyPhaseY) * shimmyForceMag
					Matter.Body.applyForce(body, { x, y }, { x: 0, y: fy })
				}
			})

			// Add random movement to non-selected bubbles
			this.addRandomMovementToNonSelectedBubbles()

			this.entities.forEach(({ element, body, halfWidth, halfHeight }) => {
				const { x, y } = body.position
				element.style.left = `${x - halfWidth}px`
				element.style.top = `${y - halfHeight}px`
			})

			requestAnimationFrame(update)
		}
		update()
	}

	/**
	 * Start the sequential bubble creation process
	 * @param bubbleComponents The bubble components to create
	 */
	private startSequentialBubbleCreation(bubbleComponents: readonly Bubble[]) {
		// Clear any existing queue and interval
		// Shuffle the bubble components for random appearance order
		const shuffledBubbles = [...bubbleComponents].sort(() => Math.random() - 0.5)
		this.bubbleCreationQueue = shuffledBubbles
		clearInterval(this.bubbleCreationInterval)
		this.entities = []
		// Reset side tracking to start with left
		this.nextBubbleSide = 'left'

		// Create boundaries immediately
		const container = this.container().nativeElement
		const width = container.clientWidth || container.offsetWidth || 0
		const height = container.clientHeight || container.offsetHeight || 0
		this.gravitationalCenter = { x: width / 2, y: height / 2 }
		this.createOrUpdateBoundaries()

		// Initially hide all bubbles
		bubbleComponents.forEach((bubbleComponent) => {
			const element = bubbleComponent.element.nativeElement
			element.style.position = 'absolute'
			element.style.zIndex = '1'
			element.style.opacity = '0' // Start invisible
		})

		// Setup simulation and resize handling
		this.setupResizeHandling()
		this.runSimulation()

		// Start the creation interval
		this.bubbleCreationInterval = setInterval(() => {
			if (this.bubbleCreationQueue.length > 0) {
				const bubbleComponent = this.bubbleCreationQueue.shift()
				this.createSingleBubble(bubbleComponent!)
			} else {
				clearInterval(this.bubbleCreationInterval)
			}
		}, this.bubbleCreationDelay)
	}

	/**
	 * Create a single bubble with animation
	 * @param bubbleComponent The bubble component to create
	 * @param remainingBubbles The number of bubbles remaining in the queue
	 */
	private createSingleBubble(bubbleComponent: Bubble) {
		const Bodies = Matter.Bodies
		const Composite = Matter.Composite

		const container = this.container().nativeElement
		const width = container.clientWidth || container.offsetWidth || 0
		const height = container.clientHeight || container.offsetHeight || 0

		const element = bubbleComponent.element.nativeElement
		const halfWidth = (element.offsetWidth || 60) / 2
		const halfHeight = (element.offsetHeight || 60) / 2
		const radius = Math.max(halfWidth, halfHeight)

		// Calculate position - alternate between bottom-left and bottom-right
		const side = this.nextBubbleSide
		this.nextBubbleSide = side === 'left' ? 'right' : 'left' // Toggle for next bubble

		// Position at bottom corners with some padding from edges
		const padding = radius + 20 // Add padding to prevent touching edges
		const startX = side === 'left' ? padding : width - padding
		// Start at the bottom wall of the container (visible inside the container)
		const startY = height - radius // Position at the bottom wall, fully visible

		// Create the physics body
		const body = Bodies.circle(startX, startY, radius, {
			restitution: 0.294, // Reduced bounce force by 30% (from 0.42)
			frictionAir: 0.001, // Even lower air friction for better movement
			friction: 0.03, // Lower friction between objects
			frictionStatic: 0.03, // Lower static friction
			density: 0.0003, // Even lower density for more responsive rising
			inertia: Infinity, // Prevent rotation
		})

		// Initial velocity toward center with slight upward component
		const centerX = width / 2
		const centerY = height / 2
		const dx = centerX - startX
		const dy = centerY - startY
		const distance = Math.sqrt(dx * dx + dy * dy)

		// Calculate velocity toward center with some upward bias
		// For bubbles from left, angle slightly right; from right, angle slightly left
		const angleVariation = side === 'left' ? 0.2 : -0.2 // Slight angle variation based on side
		const speed = 2.0 + Math.random() * 1.0 // 2.0-3.0 pixels per frame
		const velocityX = (dx / distance) * speed * 0.8 + angleVariation // 80% toward center horizontally with side-based angle
		const velocityY = (dy / distance) * speed * 0.6 - 0.5 // 60% toward center vertically, with slight upward bias
		Matter.Body.setVelocity(body, { x: velocityX, y: velocityY })

		// Apply initial impulse toward center
		const initialImpulse = 0.0075 // 1.5x stronger impulse
		const impulseX = (dx / distance) * initialImpulse * 0.8 + angleVariation * 0.1 // 80% toward center horizontally with side-based angle
		const impulseY = (dy / distance) * initialImpulse * 0.6 - initialImpulse * 0.2 // 60% toward center, 20% upward
		Matter.Body.applyForce(body, body.position, { x: impulseX, y: impulseY })

		// Shimmy parameters per bubble
		const shimmyFreqX = 0.2 + Math.random() * 0.6 // Hz
		const shimmyFreqY = 0.2 + Math.random() * 0.6
		const shimmyPhaseX = Math.random() * Math.PI * 2
		const shimmyPhaseY = Math.random() * Math.PI * 2
		const shimmyForceMag = 0.00002 + Math.random() * 0.00006

		// Add body to world
		Composite.add(this.engine.world, body)

		// Add to entities array
		this.entities.push({
			element,
			body,
			halfWidth,
			halfHeight,
			shimmyFreqX,
			shimmyFreqY,
			shimmyPhaseX,
			shimmyPhaseY,
			shimmyForceMag,
		})

		// Animate the bubble appearance
		element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out'
		setTimeout(() => {
			element.style.visibility = 'visible' // Make visible first
			element.style.opacity = '1'
		}, 50) // Small delay to ensure transition applies
	}

	private createOrUpdateBoundaries() {
		const container = this.container().nativeElement
		const width = container.offsetWidth
		const height = container.offsetHeight
		const wallThickness = 50

		const world = this.engine.world

		// Remove previous boundaries if they exist
		if (this.boundaryWalls.length > 0) {
			Matter.Composite.remove(world, this.boundaryWalls)
			this.boundaryWalls = []
		}

		// Create boundaries aligned to the current container size
		const ceiling = Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, {
			isStatic: true,
			restitution: 0.294, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'Ceiling',
		})
		// Ground wall positioned at the bottom of the container to prevent overflow
		const ground = Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
			isStatic: true,
			restitution: 0.294, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'Ground',
		})

		// Walls created with appropriate dimensions
		const leftWall = Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
			isStatic: true,
			restitution: 0.294, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'LeftWall',
		})
		const rightWall = Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
			isStatic: true,
			restitution: 0.294, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'RightWall',
		})

		this.boundaryWalls = [ceiling, rightWall, ground, leftWall]
		Matter.Composite.add(world, this.boundaryWalls)
	}

	private setupResizeHandling() {
		const container = this.container().nativeElement

		// Handler function that updates everything on resize
		const handleResize = () => {
			// Keep the render canvas in sync with container size
			if (this.render) {
				const width = container.offsetWidth
				const height = container.offsetHeight
				this.render.options.width = width
				this.render.options.height = height
				this.render.canvas.width = width
				this.render.canvas.height = height
			}

			// Update gravitational center
			const width = container.clientWidth || container.offsetWidth || 0
			const height = container.clientHeight || container.offsetHeight || 0
			this.gravitationalCenter = { x: width / 2, y: height / 2 }

			this.createOrUpdateBoundaries()
			this.updateBubbleBodySizes()
		}

		// Debounced resize handler
		const debouncedResize = () => {
			if (this.resizeDebounceTimer) {
				clearTimeout(this.resizeDebounceTimer)
			}
			this.resizeDebounceTimer = setTimeout(handleResize, 150) // 150ms debounce delay
		}

		// Observe container resize
		this.resizeObserver = new ResizeObserver(debouncedResize)
		this.resizeObserver.observe(container)

		// Also listen to window resize events as backup (handles TailwindCSS breakpoint changes)
		// This ensures we catch size changes when the container doesn't change but bubble elements do
		this.windowResizeListener = debouncedResize
		window.addEventListener('resize', this.windowResizeListener)
	}

	private animateFinalTriadCues() {
		// First animate the 3 solved bubbles floating up to center
		this.animateSolvedBubblesFloatUp()
	}

	private async animateSolvedBubblesFloatUp() {
		// Find all solved-triad components
		const solvedTriads = Array.from(document.querySelectorAll('[id^="solved-"]'))

		if (solvedTriads.length === 0) {
			// Fallback to direct creation if no solved triads found
			this.startFinalTriadSequentialCreation(this.finalTriadCuesBubbleComponents())
			return
		}

		// Immediately hide all final triad bubbles to prevent glitch
		this.hideFinalTriadBubblesImmediately()

		// Get container dimensions for center calculation
		const container = this.container().nativeElement
		const containerRect = container.getBoundingClientRect()
		// const centerX = containerRect.width / 2
		const centerY = containerRect.height / 2

		// Animate each solved bubble to center, then fade out
		const animations = solvedTriads.map((solvedTriad, index) => {
			const element = solvedTriad as HTMLElement
			const rect = element.getBoundingClientRect()
			const containerRect = this.container().nativeElement.getBoundingClientRect()

			// Calculate relative position within container
			const currentX = rect.left - containerRect.left
			const currentY = rect.top - containerRect.top

			// Calculate target position (center with slight spread to match final triad positioning)
			const bubbleCount = this.finalTriadCuesBubbleComponents().length
			const bubbleSpacing = containerRect.width / (bubbleCount + 1)
			const targetX = (index + 1) * bubbleSpacing - currentX
			const targetY = centerY - currentY

			return new Promise<void>((resolve) => {
				// Use GSAP for smooth animation
				import('gsap').then(({ gsap }) => {
					gsap.to(element, {
						duration: 1.2, // Slightly faster to align with existing timing
						x: targetX,
						y: targetY,
						scale: 1.0, // Scale to normal size (not oversized)
						opacity: 0, // Fade out the keyword
						ease: 'power2.out',
						onComplete: () => {
							// Hide the solved triad after animation
							element.style.display = 'none'
							resolve()
						},
					})
				})
			})
		})

		// Wait for all float-up animations to complete
		await Promise.all(animations)

		// Start the final triad bubble creation with proper timing
		// The existing system uses bubbleCreationDelay (275ms) between bubbles
		// We'll start immediately after our animation completes
		this.startFinalTriadSequentialCreation(this.finalTriadCuesBubbleComponents())
	}

	private hideFinalTriadBubblesImmediately() {
		// Immediately hide all final triad bubbles to prevent visual glitch
		const finalTriadBubbles = this.finalTriadCuesBubbleComponents()
		finalTriadBubbles.forEach((bubbleComponent) => {
			const element = bubbleComponent.element.nativeElement
			element.style.position = 'absolute'
			element.style.zIndex = '2'
			element.style.opacity = '0'
			element.style.transform = 'scale(0)'
			element.style.visibility = 'hidden' // Additional hiding
			element.setAttribute('finalTriadCuesBubble', 'true')
		})
	}

	/**
	 * Start sequential creation of final triad bubbles
	 * @param bubbleComponents The final triad bubble components to create
	 */
	private startFinalTriadSequentialCreation(bubbleComponents: readonly Bubble[]) {
		// Create a queue for the final triad bubbles
		const finalTriadQueue = [...bubbleComponents]

		// Ensure all final triad bubbles are properly hidden (they should already be hidden from hideFinalTriadBubblesImmediately)
		bubbleComponents.forEach((bubbleComponent) => {
			const element = bubbleComponent.element.nativeElement
			element.style.position = 'absolute'
			element.style.zIndex = '2' // Higher z-index than regular bubbles
			element.style.opacity = '0' // Start invisible
			element.style.transform = 'scale(0)' // Start small
			element.style.visibility = 'hidden' // Ensure hidden

			// Add attribute to identify final triad bubbles for physics handling
			element.setAttribute('finalTriadCuesBubble', 'true')
		})

		// Create bubbles one after the other with a delay
		let index = 0
		const createNextBubble = () => {
			if (index < finalTriadQueue.length) {
				const bubbleComponent = finalTriadQueue[index]
				this.createFinalTriadBubble(bubbleComponent, index)
				index++
				setTimeout(createNextBubble, this.bubbleCreationDelay)
			}
		}

		// Start the sequential creation
		createNextBubble()
	}

	/**
	 * Create a single final triad bubble with animation
	 * @param bubbleComponent The bubble component to create
	 * @param index The index of the bubble in the final triad
	 */
	private createFinalTriadBubble(bubbleComponent: Bubble, index: number) {
		const Bodies = Matter.Bodies
		const Composite = Matter.Composite

		const container = this.container().nativeElement
		const width = container.clientWidth || container.offsetWidth || 0
		const height = container.clientHeight || container.offsetHeight || 0

		const element = bubbleComponent.element.nativeElement
		const halfWidth = (element.offsetWidth || 60) / 2
		const halfHeight = (element.offsetHeight || 60) / 2
		const radius = Math.max(halfWidth, halfHeight)

		// Calculate starting position at the bottom of the container
		// Distribute horizontally based on index
		const bubbleCount = this.finalTriadCuesBubbleComponents().length
		const bubbleSpacing = width / (bubbleCount + 1)
		const startX = (index + 1) * bubbleSpacing
		const startY = height - radius // Start at the bottom

		// Create the physics body
		const body = Bodies.circle(startX, startY, radius, {
			restitution: 0.2, // Lower bounce to prevent escaping
			frictionAir: 0.01, // Moderate air friction for smooth movement
			friction: 0.05, // Moderate friction between objects
			frictionStatic: 0.05, // Moderate static friction
			density: 0.0005, // Lower density for more responsive movement
			inertia: Infinity, // Prevent rotation
		})

		// Initial upward velocity with slight horizontal drift
		const upwardSpeed = 1.0 + Math.random() * 0.5 // 1.0-1.5 pixels per frame upward
		const horizontalDrift = (Math.random() - 0.5) * 0.5 // Minimal horizontal drift
		Matter.Body.setVelocity(body, { x: horizontalDrift, y: -upwardSpeed })

		// Apply a small initial impulse for a gradual rise
		const initialImpulse = 0.003
		Matter.Body.applyForce(body, body.position, { x: 0, y: -initialImpulse })

		// Shimmy parameters for gentle movement
		const shimmyFreqX = 0.1 + Math.random() * 0.2
		const shimmyFreqY = 0.1 + Math.random() * 0.2
		const shimmyPhaseX = Math.random() * Math.PI * 2
		const shimmyPhaseY = Math.random() * Math.PI * 2
		const shimmyForceMag = 0.00001 + Math.random() * 0.00001 // Very gentle force

		// Add body to world
		Composite.add(this.engine.world, body)

		// Add to entities array
		this.entities.push({
			element,
			body,
			halfWidth,
			halfHeight,
			shimmyFreqX,
			shimmyFreqY,
			shimmyPhaseX,
			shimmyPhaseY,
			shimmyForceMag,
		})

		// Animate the bubble appearance
		element.style.transition = 'opacity 0.5s ease-out'
		setTimeout(() => {
			element.style.visibility = 'visible' // Make visible first
			element.style.opacity = '1'
		}, 50) // Small delay to ensure transition applies
	}

	/**
	 * Create physics bodies that stay contained within the walls
	 * @deprecated This method is no longer used, replaced by startFinalTriadSequentialCreation
	 */
	private createContainedBodies(bubbleComponents: readonly Bubble[]) {
		const Composite = Matter.Composite
		const Bodies = Matter.Bodies

		const container = this.container().nativeElement
		const width = container.clientWidth || container.offsetWidth || 0
		const height = container.clientHeight || container.offsetHeight || 0

		// Create bodies for each bubble element
		const newEntities = bubbleComponents.map((bubbleComponent, index) => {
			const element = bubbleComponent.element.nativeElement
			element.style.position = 'absolute'
			element.style.zIndex = '1'

			const halfWidth = (element.offsetWidth || 60) / 2
			const halfHeight = (element.offsetHeight || 60) / 2
			const radius = Math.max(halfWidth, halfHeight)

			// Position bubbles in the center area of the container
			// Distribute them in a circular pattern around the center
			const bubbleCount = bubbleComponents.length
			const angle = (index / bubbleCount) * Math.PI * 2
			const distance = Math.min(width, height) * 0.25 // Keep them within 25% of center

			const bubbleX = width / 2 + Math.cos(angle) * distance
			const bubbleY = height / 2 + Math.sin(angle) * distance

			// Create the physics body with parameters that keep it contained
			const body = Bodies.circle(bubbleX, bubbleY, radius, {
				restitution: 0.2, // Lower bounce to prevent escaping
				frictionAir: 0.03, // Higher air friction to slow movement
				friction: 0.1, // Higher friction between objects
				frictionStatic: 0.1, // Higher static friction
				density: 0.001, // Higher density for more stability
				inertia: Infinity, // Prevent rotation
			})

			// Add very minimal initial velocity
			const smallVelocity = 0.2
			const randomVelX = (Math.random() - 0.5) * smallVelocity
			const randomVelY = (Math.random() - 0.5) * smallVelocity
			Matter.Body.setVelocity(body, { x: randomVelX, y: randomVelY })

			// Shimmy parameters per bubble - much gentler for final triad
			const shimmyFreqX = 0.1 + Math.random() * 0.2
			const shimmyFreqY = 0.1 + Math.random() * 0.2
			const shimmyPhaseX = Math.random() * Math.PI * 2
			const shimmyPhaseY = Math.random() * Math.PI * 2
			const shimmyForceMag = 0.000005 + Math.random() * 0.000005 // Very small force

			return {
				element,
				body,
				halfWidth,
				halfHeight,
				shimmyFreqX,
				shimmyFreqY,
				shimmyPhaseX,
				shimmyPhaseY,
				shimmyForceMag,
			}
		})

		// Add bodies to the world
		Composite.add(
			this.engine.world,
			newEntities.map(({ body }) => body),
		)

		// Add new entities to the existing ones
		this.entities = [...this.entities, ...newEntities]
	}

	private checkForRemovedBubbles() {
		const currentCues = this.cues()
		if (!currentCues) return

		// Process removed bubbles

		// Only hide bubbles that are not in the current cues array
		// This should only be the solved bubbles that were removed from the cues
		this.entities.forEach((entity) => {
			const bubbleElement = entity.element

			// Get the actual cue text from the element's child paragraph
			const cueElement = bubbleElement.querySelector('p')
			const cue = cueElement ? cueElement.textContent?.trim() : ''

			// Skip bubbles with no cue text
			if (!cue) return

			const shouldHide = !currentCues.includes(cue)

			// Only hide if this bubble is not in current cues
			// This means it was part of the solved triad and was removed
			if (shouldHide) {
				// Hide this bubble (it was part of the solved triad)
				bubbleElement.style.display = 'none'
				// Remove from physics world
				Matter.Composite.remove(this.engine.world, entity.body)
			}
		})

		// Trigger rearrangement after hiding bubbles
		setTimeout(() => {
			this.rearrangeBubbles()
		}, 100)
	}

	private rearrangeBubbles() {
		// Update gravitational center for remaining bubbles
		const container = this.container().nativeElement
		const width = container.clientWidth || container.offsetWidth || 0
		const height = container.clientHeight || container.offsetHeight || 0

		this.gravitationalCenter = { x: width / 2, y: height / 2 }

		// The gravitational pull will naturally rearrange the remaining bubbles
		// No additional animation needed as the physics will handle it
	}

	private isBubbleBody(body: Matter.Body): boolean {
		// Check if the body belongs to a bubble (not a wall)
		return this.entities.some((entity) => entity.body === body)
	}

	private handleBubbleCollision(bodyA: Matter.Body, bodyB: Matter.Body) {
		// Find the bubble entities for these bodies
		const entityA = this.entities.find((entity) => entity.body === bodyA)
		const entityB = this.entities.find((entity) => entity.body === bodyB)

		if (entityA && entityB) {
			// Apply reduced bounce force for more controlled collisions
			const force = 0.01225 // Reduced by 30% (from 0.0175)
			const directionA = {
				x: (bodyA.position.x - bodyB.position.x) * force,
				y: (bodyA.position.y - bodyB.position.y) * force,
			}
			const directionB = {
				x: (bodyB.position.x - bodyA.position.x) * force,
				y: (bodyB.position.y - bodyA.position.y) * force,
			}

			Matter.Body.applyForce(bodyA, bodyA.position, directionA)
			Matter.Body.applyForce(bodyB, bodyB.position, directionB)

			// Add reduced velocity boost for more controlled separation
			const velocityBoost = 0.0735 // Reduced by 30% (from 0.105)
			const currentVelA = bodyA.velocity
			const currentVelB = bodyB.velocity

			Matter.Body.setVelocity(bodyA, {
				x: currentVelA.x + directionA.x * velocityBoost,
				y: currentVelA.y + directionA.y * velocityBoost,
			})

			Matter.Body.setVelocity(bodyB, {
				x: currentVelB.x + directionB.x * velocityBoost,
				y: currentVelB.y + directionB.y * velocityBoost,
			})
		}
	}

	private addRandomMovementToNonSelectedBubbles() {
		this.entities.forEach((entity) => {
			const bubbleElement = entity.element
			const bubbleId = bubbleElement.id
			const cue = bubbleId.replace('bubble-', '')
			const isSelected = this.store.selectedCues().includes(cue)

			// Only add random movement to non-selected bubbles
			if (!isSelected) {
				// Add random forces for movement (reduced by 30%)
				const randomForceX = (Math.random() - 0.5) * 0.0014 // Reduced by 30% (from 0.002)
				const randomForceY = (Math.random() - 0.5) * 0.0014 // Reduced by 30% (from 0.002)

				Matter.Body.applyForce(entity.body, entity.body.position, {
					x: randomForceX,
					y: randomForceY,
				})
			}
		})
	}

	/**
	 * Update Matter.js body sizes to match current DOM element dimensions
	 * This handles TailwindCSS responsive class changes on window resize
	 */
	private updateBubbleBodySizes() {
		const container = this.container().nativeElement
		const containerWidth = container.clientWidth || container.offsetWidth || 0
		const containerHeight = container.clientHeight || container.offsetHeight || 0

		const updatedEntities: typeof this.entities = []

		// First pass: scale all bubbles and update dimensions
		this.entities.forEach((entity) => {
			const { element, body } = entity

			// Check if bubble should be visible (is in current cues)
			const isInCurrentCues =
				this.cues()?.some((cue) => {
					const cueElement = element.querySelector('p')
					return cueElement?.textContent?.trim() === cue
				}) ?? true

			// Skip only if element is explicitly meant to be hidden AND not in current cues
			if (element.style.display === 'none' && !isInCurrentCues) {
				return
			}

			// Ensure element remains visible during resize (restore if accidentally hidden)
			// This prevents bubbles from disappearing during resize
			if (element.style.display === 'none') {
				element.style.display = ''
			}
			if (element.style.visibility === 'hidden') {
				element.style.visibility = 'visible'
			}
			// Ensure opacity is visible (don't override if it's being animated via transition)
			if (element.style.opacity === '0' && !element.style.transition) {
				element.style.opacity = '1'
			}

			// Ensure element has position absolute (required for proper positioning)
			if (!element.style.position || element.style.position === 'static') {
				element.style.position = 'absolute'
			}

			// Force a reflow to ensure TailwindCSS classes have been applied
			void element.offsetHeight

			// Get current DOM element dimensions (after TailwindCSS responsive changes)
			// Ensure we get valid dimensions even if element is temporarily 0-sized
			let currentWidth = element.offsetWidth || element.clientWidth
			let currentHeight = element.offsetHeight || element.clientHeight

			// If dimensions are 0, try getBoundingClientRect as fallback
			if (!currentWidth || !currentHeight) {
				const rect = element.getBoundingClientRect()
				currentWidth = rect.width || currentWidth || 60
				currentHeight = rect.height || currentHeight || 60
			}

			// Final fallback to stored dimensions or default
			currentWidth = currentWidth || entity.halfWidth * 2 || 60
			currentHeight = currentHeight || entity.halfHeight * 2 || 60

			const newHalfWidth = currentWidth / 2
			const newHalfHeight = currentHeight / 2
			const newRadius = Math.max(newHalfWidth, newHalfHeight)

			// Calculate current body radius from stored dimensions
			// Use stored halfWidth/halfHeight which represents the current physics body size
			const currentRadius = Math.max(entity.halfWidth, entity.halfHeight)

			// Avoid division by zero or invalid values
			if (currentRadius <= 0 || newRadius <= 0 || !isFinite(currentRadius) || !isFinite(newRadius)) {
				// Reset to reasonable defaults if invalid
				if (currentRadius <= 0 || !isFinite(currentRadius)) {
					entity.halfWidth = newHalfWidth
					entity.halfHeight = newHalfHeight
				}
				return
			}

			// Calculate scale factor
			const scaleFactor = newRadius / currentRadius

			// Only update if size has actually changed (more than 1% difference)
			if (Math.abs(scaleFactor - 1) > 0.01 && isFinite(scaleFactor)) {
				// Scale the body while maintaining its position
				Matter.Body.scale(body, scaleFactor, scaleFactor)

				// Update stored dimensions in entity
				entity.halfWidth = newHalfWidth
				entity.halfHeight = newHalfHeight

				// Ensure bubble remains within container boundaries
				const { x, y } = body.position
				const maxX = containerWidth - newRadius
				const maxY = containerHeight - newRadius
				const minX = newRadius
				const minY = newRadius

				// Ensure bubble position is valid
				if (!isFinite(x) || !isFinite(y)) {
					// Reset position to center if invalid
					Matter.Body.setPosition(body, {
						x: Math.max(minX, Math.min(maxX, containerWidth / 2)),
						y: Math.max(minY, Math.min(maxY, containerHeight / 2)),
					})
					return
				}

				// Apply gentle containment if bubble is outside boundaries
				if (x < minX || x > maxX || y < minY || y > maxY) {
					const centerX = containerWidth / 2
					const centerY = containerHeight / 2
					const dx = centerX - x
					const dy = centerY - y
					const distance = Math.sqrt(dx * dx + dy * dy)

					if (distance > 0 && isFinite(distance)) {
						const containmentForce = 0.0003
						const forceX = (dx / distance) * containmentForce
						const forceY = (dy / distance) * containmentForce
						Matter.Body.applyForce(body, body.position, { x: forceX, y: forceY })
					}

					// Clamp position to boundaries if way outside
					if (x < minX - newRadius || x > maxX + newRadius || y < minY - newRadius || y > maxY + newRadius) {
						const clampedX = Math.max(minX, Math.min(maxX, x))
						const clampedY = Math.max(minY, Math.min(maxY, y))
						Matter.Body.setPosition(body, { x: clampedX, y: clampedY })
					}
				}

				// Ensure element position is updated to match body
				element.style.left = `${body.position.x - newHalfWidth}px`
				element.style.top = `${body.position.y - newHalfHeight}px`

				// Track updated entities for overlap resolution
				updatedEntities.push(entity)
			}
		})

		// Second pass: resolve overlaps after scaling
		// This prevents bubbles from getting stuck when they grow in size
		if (updatedEntities.length > 0) {
			this.resolveOverlapsAfterResize(updatedEntities)
			// Also resolve wall intersections
			this.resolveWallIntersections(updatedEntities, containerWidth, containerHeight)
		}
	}

	/**
	 * Resolve intersections between bubbles and walls after resize
	 * Pushes bubbles away from walls if they're intersecting
	 */
	private resolveWallIntersections(entities: typeof this.entities, containerWidth: number, containerHeight: number) {
		entities.forEach((entity) => {
			const { body } = entity
			const radius = Math.max(entity.halfWidth, entity.halfHeight)
			const { x, y } = body.position

			// Check and resolve intersections with each wall
			// Left wall (at x = 0)
			if (x - radius < 0) {
				const overlap = radius - x
				const pushForce = 0.02 * overlap
				Matter.Body.applyForce(body, body.position, { x: pushForce, y: 0 })
				// Immediately adjust position if severely intersecting
				if (x - radius < -radius * 0.5) {
					Matter.Body.setPosition(body, { x: radius, y })
				}
			}

			// Right wall (at x = containerWidth)
			if (x + radius > containerWidth) {
				const overlap = x + radius - containerWidth
				const pushForce = -0.02 * overlap
				Matter.Body.applyForce(body, body.position, { x: pushForce, y: 0 })
				// Immediately adjust position if severely intersecting
				if (x + radius > containerWidth + radius * 0.5) {
					Matter.Body.setPosition(body, { x: containerWidth - radius, y })
				}
			}

			// Ceiling (at y = 0)
			if (y - radius < 0) {
				const overlap = radius - y
				const pushForce = 0.02 * overlap
				Matter.Body.applyForce(body, body.position, { x: 0, y: pushForce })
				// Immediately adjust position if severely intersecting
				if (y - radius < -radius * 0.5) {
					Matter.Body.setPosition(body, { x, y: radius })
				}
			}

			// Ground (at y = containerHeight)
			if (y + radius > containerHeight) {
				const overlap = y + radius - containerHeight
				const pushForce = -0.02 * overlap
				Matter.Body.applyForce(body, body.position, { x: 0, y: pushForce })
				// Immediately adjust position if severely intersecting
				if (y + radius > containerHeight + radius * 0.5) {
					Matter.Body.setPosition(body, { x, y: containerHeight - radius })
				}
			}
		})
	}

	/**
	 * Resolve overlaps between bubbles after resize
	 * Applies separation forces to prevent bubbles from getting stuck
	 */
	private resolveOverlapsAfterResize(entities: typeof this.entities) {
		// Check each pair of bubbles for overlaps
		for (let i = 0; i < entities.length; i++) {
			const entityA = entities[i]
			const { body: bodyA, halfWidth: halfWidthA, halfHeight: halfHeightA } = entityA
			const radiusA = Math.max(halfWidthA, halfHeightA)
			const posA = bodyA.position

			for (let j = i + 1; j < entities.length; j++) {
				const entityB = entities[j]
				const { body: bodyB, halfWidth: halfWidthB, halfHeight: halfHeightB } = entityB
				const radiusB = Math.max(halfWidthB, halfHeightB)
				const posB = bodyB.position

				// Calculate distance between bubble centers
				const dx = posA.x - posB.x
				const dy = posA.y - posB.y
				const distance = Math.sqrt(dx * dx + dy * dy)
				const minDistance = radiusA + radiusB

				// If bubbles are overlapping or too close
				if (distance < minDistance && distance > 0) {
					// Calculate overlap amount
					const overlap = minDistance - distance
					const overlapRatio = overlap / minDistance

					// Apply separation force proportional to overlap
					// Stronger force for larger overlaps
					const separationForce = 0.015 * overlapRatio // Increased from 0.01 for better separation
					const forceMagnitude = separationForce * (overlap / distance)

					const forceXA = (dx / distance) * forceMagnitude
					const forceYA = (dy / distance) * forceMagnitude
					const forceXB = (-dx / distance) * forceMagnitude
					const forceYB = (-dy / distance) * forceMagnitude

					// Apply forces to both bodies
					Matter.Body.applyForce(bodyA, posA, { x: forceXA, y: forceYA })
					Matter.Body.applyForce(bodyB, posB, { x: forceXB, y: forceYB })

					// Also apply velocity boost for immediate separation
					const velocityBoost = 0.5 * overlapRatio
					const currentVelA = bodyA.velocity
					const currentVelB = bodyB.velocity

					Matter.Body.setVelocity(bodyA, {
						x: currentVelA.x + forceXA * velocityBoost,
						y: currentVelA.y + forceYA * velocityBoost,
					})

					Matter.Body.setVelocity(bodyB, {
						x: currentVelB.x + forceXB * velocityBoost,
						y: currentVelB.y + forceYB * velocityBoost,
					})
				}
			}
		}
	}
}
