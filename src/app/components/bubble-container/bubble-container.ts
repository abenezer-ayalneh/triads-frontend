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

	fourthTriadBubbleComponents = viewChildren<Bubble>('fourthTriadBubble')

	container = viewChild.required<ElementRef<HTMLDivElement>>('container')

	engine: Matter.Engine

	entities: BubbleMatter[] = []

	private render?: Matter.Render

	private runner?: Matter.Runner

	private resizeObserver?: ResizeObserver

	constructor() {
		this.engine = Matter.Engine.create({
			gravity: { x: 0, y: 0, scale: 0 },
		})

		effect(() => {
			const fourthTriadReached = this.store.triadsStep() === 'FOURTH'

			if (fourthTriadReached && this.fourthTriadBubbleComponents().length === 3) {
				this.animateFourthTriad()
			}
		})
	}

	ngAfterViewInit() {
		this.createBodies(this.bubbleComponents())
	}

	createBodies(bubbleComponents: readonly Bubble[]) {
		const Composite = Matter.Composite,
			Body = Matter.Body,
			Bodies = Matter.Bodies

		const container = this.container().nativeElement
		const width = container.clientWidth || container.offsetWidth || 0
		const height = container.clientHeight || container.offsetHeight || 0

		// Create bodies for each bubble element
		this.entities = bubbleComponents.map((bubbleComponent) => {
			const element = bubbleComponent.element.nativeElement
			// Ensure positioned absolutely so left/top works
			element.style.position = 'absolute'
			element.style.zIndex = '1'

			const halfWidth = (element.offsetWidth || 60) / 2
			const halfHeight = (element.offsetHeight || 60) / 2

			const radius = Math.max(halfWidth, halfHeight)
			const x = Math.random() * Math.max(1, width - radius * 2) + radius
			const y = Math.random() * Math.max(1, height - radius * 2) + radius
			const body = Bodies.circle(x, y, radius, {
				restitution: 0.9,
				frictionAir: 0.02,
			})

			// Give a random initial velocity so bodies float around
			const speed = 2
			const vx = (Math.random() * 2 - 1) * speed
			const vy = (Math.random() * 2 - 1) * speed
			Body.setVelocity(body, { x: vx, y: vy })

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

		// Add boundaries aligned to container size
		this.createOrUpdateBoundaries()

		// Observe container resizes to keep boundaries and canvas in sync
		this.setupResizeHandling()

		// Use custom simulation loop
		this.runSimulation()
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
			this.entities.forEach(({ element, body, halfWidth, halfHeight, shimmyFreqX, shimmyFreqY, shimmyPhaseX, shimmyPhaseY, shimmyForceMag }) => {
				const { x, y } = body.position
				// Apply tiny sinusoidal forces for subtle drift
				if (shimmyFreqX && shimmyPhaseX && shimmyForceMag) {
					const fx = Math.sin(2 * Math.PI * shimmyFreqX * now + shimmyPhaseX) * shimmyForceMag
					Matter.Body.applyForce(body, { x, y }, { x: fx, y: 0 })
				}
				if (shimmyFreqY && shimmyPhaseY && shimmyForceMag) {
					const fy = Math.cos(2 * Math.PI * shimmyFreqY * now + shimmyPhaseY) * shimmyForceMag
					Matter.Body.applyForce(body, { x, y }, { x: 0, y: fy })
				}

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
			restitution: 1,
			friction: 0,
			frictionStatic: 0,
			label: 'Ceiling',
		})
		ground = Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
			isStatic: true,
			restitution: 1,
			friction: 0,
			frictionStatic: 0,
			label: 'Ground',
		})
		leftWall = Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
			isStatic: true,
			restitution: 1,
			friction: 0,
			frictionStatic: 0,
			label: 'LeftWall',
		})
		rightWall = Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
			isStatic: true,
			restitution: 1,
			friction: 0,
			frictionStatic: 0,
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

	private animateFourthTriad() {
		this.fourthTriadBubbleComponents().forEach((bubble) => {
			this.moveToBubblesContainer(bubble.cue())
		})
		this.createBodies(this.fourthTriadBubbleComponents())
	}
}
