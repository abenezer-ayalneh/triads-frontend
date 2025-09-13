import { AfterViewInit, Component, effect, ElementRef, inject, input, OnDestroy, viewChild, viewChildren } from '@angular/core'
import { gsap } from 'gsap'
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
		this.createBodies(this.bubbleComponents())
	}

	createBodies(bubbleComponents: readonly Bubble[]) {
		const Composite = Matter.Composite,
			Bodies = Matter.Bodies

		const container = this.container().nativeElement
		const width = container.clientWidth || container.offsetWidth || 0
		const height = container.clientHeight || container.offsetHeight || 0

		// Set gravitational center
		this.gravitationalCenter = { x: width / 2, y: height / 2 }

		// Create boundaries immediately with the same dimensions
		this.createOrUpdateBoundaries()

		// Create bodies for each bubble element
		this.entities = bubbleComponents.map((bubbleComponent, index) => {
			const element = bubbleComponent.element.nativeElement
			// Ensure positioned absolutely so left/top works
			element.style.position = 'absolute'
			element.style.zIndex = '1'

			const halfWidth = (element.offsetWidth || 60) / 2
			const halfHeight = (element.offsetHeight || 60) / 2

			const radius = Math.max(halfWidth, halfHeight)

			// Start bubbles from bottom of screen for rising animation
			// Spread bubbles across the width to ensure all are visible
			const bubbleSpacing = width / bubbleComponents.length
			const startX = index * bubbleSpacing + bubbleSpacing / 2
			// Start bubbles just below the visible area but above the ground wall
			// Ground wall is now at height + wallThickness/2, so start above it
			const startY = height - 50 // Start 50px above the bottom of container

			// Start position created

			const body = Bodies.circle(startX, startY, radius, {
				restitution: 0.42, // Reduced bounce force by 30% (from 0.6)
				frictionAir: 0.005, // Very low air friction for more movement
				friction: 0.05, // Very low friction between objects
				frictionStatic: 0.05, // Very low static friction
				density: 0.0005, // Lower density for more responsive movement
				inertia: Infinity, // Prevent rotation
			})

			// Initial upward velocity for rising effect with horizontal drift - slower rise
			const upwardSpeed = 2 + Math.random() * 1.5 // 2-3.5 pixels per frame upward (much slower)
			const horizontalDrift = (Math.random() - 0.5) * 1.5 // Reduced horizontal drift
			Matter.Body.setVelocity(body, { x: horizontalDrift, y: -upwardSpeed })

			// Shimmy parameters per bubble
			const shimmyFreqX = 0.2 + Math.random() * 0.6 // Hz
			const shimmyFreqY = 0.2 + Math.random() * 0.6
			const shimmyPhaseX = Math.random() * Math.PI * 2
			const shimmyPhaseY = Math.random() * Math.PI * 2
			const shimmyForceMag = 0.00002 + Math.random() * 0.00006

			return { element, body, halfWidth, halfHeight, shimmyFreqX, shimmyFreqY, shimmyPhaseX, shimmyPhaseY, shimmyForceMag }
		})

		// Add bodies to the world
		Composite.add(
			this.engine.world,
			this.entities.map(({ body }) => body),
		)

		// Observe container resizes to keep boundaries and canvas in sync
		this.setupResizeHandling()

		// Use custom simulation loop
		this.runSimulation()

		// Mark initial spawn as complete after rising animation
		if (this.isInitialSpawn) {
			setTimeout(() => {
				this.isInitialSpawn = false
			}, 3000) // 3 seconds delay to allow rising animation
		}
	}

	ngOnDestroy(): void {
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

			const now = performance.now() / 1000 // seconds
			this.entities.forEach(({ body, shimmyFreqX, shimmyFreqY, shimmyPhaseX, shimmyPhaseY, shimmyForceMag }) => {
				const { x, y } = body.position

				// Apply upward force during initial rising phase
				if (this.isInitialSpawn && y > 0) {
					const upwardForce = 0.0005 // Gentle upward force
					Matter.Body.applyForce(body, { x, y }, { x: 0, y: -upwardForce })
				}

				// Apply gravitational pull toward center after rising phase
				if (!this.isInitialSpawn) {
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

	private moveToBubblesContainer(cue: string) {
		const bubbleSelector = `#bubble-${cue}`
		const solutionBox = document.getElementById('solutionBox')

		if (solutionBox) {
			const boxRect = solutionBox.getBoundingClientRect()
			const bubbleElem = document.querySelector(bubbleSelector) as HTMLElement
			if (!bubbleElem) return

			const bubbleRect = bubbleElem.getBoundingClientRect()
			const startX = boxRect.left + boxRect.width / 2 - bubbleRect.width / 2 - bubbleRect.left + bubbleElem.offsetLeft
			const startY = boxRect.top + boxRect.height / 2 - bubbleRect.height / 2 - bubbleRect.top + bubbleElem.offsetTop

			gsap.fromTo(bubbleElem, { x: startX, y: startY, scale: 0.2, display: 'block' }, { duration: 3, x: 0, y: 0, scale: 1, display: 'block' })
		}
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
			restitution: 0.42, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'Ceiling',
		})
		// Ground wall positioned at the bottom of the container to prevent overflow
		ground = Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
			isStatic: true,
			restitution: 0.42, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'Ground',
		})

		// Walls created with appropriate dimensions
		leftWall = Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
			isStatic: true,
			restitution: 0.42, // Same bounce as bubbles (reduced by 30%)
			friction: 0.05, // Same friction as bubbles
			frictionStatic: 0.05, // Same static friction as bubbles
			label: 'LeftWall',
		})
		rightWall = Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
			isStatic: true,
			restitution: 0.42, // Same bounce as bubbles (reduced by 30%)
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
		this.finalTriadCuesBubbleComponents().forEach((bubble) => {
			this.moveToBubblesContainer(bubble.cue())
		})
		this.createBodies(this.finalTriadCuesBubbleComponents())
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
			const force = 0.0175 // Reduced by 30% from 0.025
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
			const velocityBoost = 0.105 // Reduced by 30% from 0.15
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
				// Add stronger random forces for more active movement
				const randomForceX = (Math.random() - 0.5) * 0.002 // Increased from 0.0005
				const randomForceY = (Math.random() - 0.5) * 0.002 // Increased from 0.0005

				Matter.Body.applyForce(entity.body, entity.body.position, {
					x: randomForceX,
					y: randomForceY,
				})
			}
		})
	}
}
