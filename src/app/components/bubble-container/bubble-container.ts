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

	private isInitialSpawn = true

	// Properties for sequential bubble creation
	private bubbleCreationQueue: Bubble[] = []

	private bubbleCreationInterval: ReturnType<typeof setInterval> | undefined

	private bubbleCreationDelay = 500 // milliseconds between each bubble creation (increased for more visible sequence)

	private gravitationalCenter: { x: number; y: number } = { x: 0, y: 0 }

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
			if (currentCues && !this.isInitialSpawn) {
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

				// Apply gentle upward force during initial rising phase for visible rising
				if (this.isInitialSpawn && y > 0 && !isFinalTriadBubble) {
					// Calculate how far the bubble has risen from the bottom
					const distanceFromBottom = height - y
					const maxRisingDistance = height * 0.7 // Consider bubble "risen" when it reaches 70% of container height

					// Apply stronger force at the beginning, gradually decreasing as bubble rises
					const progressFactor = Math.max(0, 1 - distanceFromBottom / maxRisingDistance)
					const upwardForce = 0.001 * (progressFactor * 0.8 + 0.2) // Gentle continuous upward force that decreases as bubble rises
					Matter.Body.applyForce(body, { x, y }, { x: 0, y: -upwardForce })

					// Apply a small force toward the center during rising, stronger as bubble rises higher
					const dx = this.gravitationalCenter.x - x
					const dy = this.gravitationalCenter.y - y
					const distance = Math.sqrt(dx * dx + dy * dy)

					if (distance > 0) {
						// Centering force increases as bubble rises higher
						const centeringFactor = Math.min(1, distanceFromBottom / (height * 0.3))
						const centeringForce = 0.0003 * centeringFactor
						const forceX = (dx / distance) * centeringForce
						// Minimal vertical centering until bubble is higher up
						const verticalFactor = Math.min(1, distanceFromBottom / (height * 0.5))
						const forceY = (dy / distance) * centeringForce * verticalFactor
						Matter.Body.applyForce(body, { x, y }, { x: forceX, y: forceY })
					}
				}

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
				// Apply gravitational pull toward center after rising phase for normal bubbles
				else if (!this.isInitialSpawn) {
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

			// Add random movement to non-selected bubbles after rising phase
			if (!this.isInitialSpawn) {
				this.addRandomMovementToNonSelectedBubbles()
			}

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
		this.bubbleCreationQueue = [...bubbleComponents]
		clearInterval(this.bubbleCreationInterval)
		this.entities = []

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
			element.style.transform = 'scale(0)' // Start small
		})

		// Setup simulation and resize handling
		this.setupResizeHandling()
		this.runSimulation()

		// Start the creation interval
		this.bubbleCreationInterval = setInterval(() => {
			if (this.bubbleCreationQueue.length > 0) {
				const bubbleComponent = this.bubbleCreationQueue.shift()
				this.createSingleBubble(bubbleComponent!, this.bubbleCreationQueue.length)
			} else {
				clearInterval(this.bubbleCreationInterval)
				// All bubbles created, mark initial spawn as complete after a longer delay
				// Calculate total rising time based on number of bubbles and creation delay
				const totalBubbles = this.bubbleComponents().length
				const risingTime = totalBubbles * this.bubbleCreationDelay + 5000 // Creation time + extra time for rising

				setTimeout(() => {
					this.isInitialSpawn = false
				}, risingTime) // Dynamic delay to ensure all bubbles have time to rise to the center
			}
		}, this.bubbleCreationDelay)
	}

	/**
	 * Create a single bubble with animation
	 * @param bubbleComponent The bubble component to create
	 * @param remainingBubbles The number of bubbles remaining in the queue
	 */
	private createSingleBubble(bubbleComponent: Bubble, remainingBubbles: number) {
		const Bodies = Matter.Bodies
		const Composite = Matter.Composite

		const container = this.container().nativeElement
		const width = container.clientWidth || container.offsetWidth || 0
		const height = container.clientHeight || container.offsetHeight || 0

		const element = bubbleComponent.element.nativeElement
		const halfWidth = (element.offsetWidth || 60) / 2
		const halfHeight = (element.offsetHeight || 60) / 2
		const radius = Math.max(halfWidth, halfHeight)

		// Calculate position - spread across width
		const totalBubbles = this.bubbleComponents().length
		const index = totalBubbles - remainingBubbles - 1
		const bubbleSpacing = width / totalBubbles
		const startX = index * bubbleSpacing + bubbleSpacing / 2
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

		// Initial upward velocity for rising effect with horizontal drift - slower for more visible rising
		const upwardSpeed = 1.5 + Math.random() * 1 // 1.5-2.5 pixels per frame upward (slower, more visible rise)
		const horizontalDrift = (Math.random() - 0.5) * 1 // Minimal horizontal drift
		Matter.Body.setVelocity(body, { x: horizontalDrift, y: -upwardSpeed })

		// Apply a smaller initial impulse for a more gradual rise
		const initialImpulse = 0.005
		Matter.Body.applyForce(body, body.position, { x: 0, y: -initialImpulse })

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
			element.style.opacity = '1'
			element.style.transform = 'scale(1)'
		}, 50) // Small delay to ensure transition applies
	}

	private createOrUpdateBoundaries() {
		let ceiling: Matter.Body | null = null
		let ground: Matter.Body | null = null
		let leftWall: Matter.Body | null = null
		let rightWall: Matter.Body | null = null

		const container = this.container().nativeElement
		const width = container.offsetWidth
		const height = container.offsetHeight
		const wallThickness = 50

		// Remove previous boundaries if they exist
		const world = this.engine.world
		const toRemove: Matter.Body[] = []
		if (ceiling) toRemove.push(ceiling)
		if (ground) toRemove.push(ground)
		if (leftWall) toRemove.push(leftWall)
		if (rightWall) toRemove.push(rightWall)
		if (toRemove.length) {
			Matter.Composite.remove(world, toRemove)
		}

		// Create boundaries aligned to the current container size
		ceiling = Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, {
			isStatic: true,
			restitution: 0.294, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'Ceiling',
		})
		// Ground wall positioned at the bottom of the container to prevent overflow
		ground = Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
			isStatic: true,
			restitution: 0.294, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'Ground',
		})

		// Walls created with appropriate dimensions
		leftWall = Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
			isStatic: true,
			restitution: 0.294, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'LeftWall',
		})
		rightWall = Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
			isStatic: true,
			restitution: 0.294, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'RightWall',
		})

		Matter.Composite.add(world, [ceiling, rightWall, ground, leftWall])
	}

	private setupResizeHandling() {
		const container = this.container().nativeElement
		this.resizeObserver = new ResizeObserver(() => {
			// Keep the render canvas in sync with container size
			if (this.render) {
				const width = container.offsetWidth
				const height = container.offsetHeight
				this.render.options.width = width
				this.render.options.height = height
				this.render.canvas.width = width
				this.render.canvas.height = height
			}
			this.createOrUpdateBoundaries()
		})
		this.resizeObserver.observe(container)
	}

	private animateFinalTriadCues() {
		// Start sequential creation of final triad bubbles
		this.startFinalTriadSequentialCreation(this.finalTriadCuesBubbleComponents())
	}

	/**
	 * Start sequential creation of final triad bubbles
	 * @param bubbleComponents The final triad bubble components to create
	 */
	private startFinalTriadSequentialCreation(bubbleComponents: readonly Bubble[]) {
		// Create a queue for the final triad bubbles
		const finalTriadQueue = [...bubbleComponents]

		// Initially hide all final triad bubbles
		bubbleComponents.forEach((bubbleComponent) => {
			const element = bubbleComponent.element.nativeElement
			element.style.position = 'absolute'
			element.style.zIndex = '2' // Higher z-index than regular bubbles
			element.style.opacity = '0' // Start invisible
			element.style.transform = 'scale(0)' // Start small

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
		element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out'
		setTimeout(() => {
			element.style.opacity = '1'
			element.style.transform = 'scale(1)'
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
}
