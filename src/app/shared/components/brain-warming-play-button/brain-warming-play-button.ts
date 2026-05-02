import { DOCUMENT } from '@angular/common'
import { Component, ElementRef, inject, input, OnDestroy, signal, viewChild } from '@angular/core'
import { Router } from '@angular/router'

const LIGHT_GREY = '#01fac0'
const WHITE = '#ffffff'
const MID_GREY = '#fbeaea'
const HOT_RED = '#EF1A1A'
const BASE_FONT_PX = 20
const PREFIX_BIG_PX = 28
const HOT_BIG_PX = 52
const PULSE_MS = 500
const CROSSFADE_MS = 600
const CROSSFADE_AT_MS = 1750
const PHASE2_START_MS = CROSSFADE_AT_MS + CROSSFADE_MS
const SHIMMER_AT_MS = PHASE2_START_MS + 2000
const EXPLODE_AT_MS = PHASE2_START_MS + 3500
const PLAY_HIDE_DELAY_MS = 300
const NAV_AFTER_EXPLODE_MS = 100

const CONFETTI_COLORS = ['#EF1A1A', '#FF6B6B', '#FF4444', '#CC0000', '#FF8C00', '#FFD700', '#FF3300', '#FF0066', '#CC3300']

const LETTER_SHARD = ['h', 'o', 't', 'H', 'O', 'T', 'h', 'o', 't', 'H', 'O', 'T']

const PARTICLE_SELECTOR = '[data-brain-play-particle="1"]'

@Component({
	selector: 'app-brain-warming-play-button',
	templateUrl: './brain-warming-play-button.html',
	styleUrl: './brain-warming-play-button.scss',
})
export class BrainWarmingPlayButton implements OnDestroy {
	readonly buttonClasses = input('triad-gradient btn btn-lg w-80 max-w-full border-none text-primary-content')

	readonly playLabelText = input('Play Now')

	readonly navigateCommands = input<readonly string[]>(['/play'])

	private readonly router = inject(Router)

	private readonly document = inject(DOCUMENT)

	private timers: ReturnType<typeof setTimeout>[] = []

	readonly animationRunning = signal(false)

	private readonly playLabelSpan = viewChild<ElementRef<HTMLSpanElement>>('playLabelSpan')

	private readonly bt1Span = viewChild<ElementRef<HTMLSpanElement>>('bt1Span')

	private readonly bt2Span = viewChild<ElementRef<HTMLSpanElement>>('bt2Span')

	private readonly bHotSpan = viewChild<ElementRef<HTMLSpanElement>>('bHotSpan')

	private readonly bPrefixSpan = viewChild<ElementRef<HTMLSpanElement>>('bPrefixSpan')

	ngOnDestroy() {
		this.clearTimers()
		this.removeParticles()
	}

	/** Lets parents reset overlays/timers after route or API refresh without accessing DOM. */
	resetVisualState() {
		this.clearTimers()
		this.removeParticles()
		this.animationRunning.set(false)

		const play = this.playLabelSpan()?.nativeElement
		if (play) {
			play.style.opacity = '1'
			play.style.pointerEvents = ''
		}

		const bt1 = this.bt1Span()?.nativeElement
		if (bt1) {
			bt1.style.transition = 'none'
			bt1.style.opacity = '0'
			bt1.style.color = '#bbbbbb'
		}

		const bt2 = this.bt2Span()?.nativeElement
		if (bt2) {
			bt2.style.transition = 'none'
			bt2.style.opacity = '0'
		}

		const bHot = this.bHotSpan()?.nativeElement
		if (bHot) {
			bHot.style.transition = 'none'
			bHot.style.color = MID_GREY
			bHot.style.fontSize = `${BASE_FONT_PX}px`
			bHot.classList.remove('brain-play-hot--shimmer')
		}

		const bPrefix = this.bPrefixSpan()?.nativeElement
		if (bPrefix) {
			bPrefix.style.transition = 'none'
			bPrefix.style.color = MID_GREY
			bPrefix.style.fontSize = `${BASE_FONT_PX}px`
		}
	}

	onPlayClicked() {
		if (this.animationRunning()) {
			return
		}
		const play = this.playLabelSpan()?.nativeElement
		if (!play) {
			return
		}
		this.animationRunning.set(true)

		play.style.opacity = '0'
		play.style.pointerEvents = 'none'
		this.clearTimers()
		this.removeParticles()

		this.after(PLAY_HIDE_DELAY_MS, () => this.startBrainWarmingSequence())

		const navigateAt = PLAY_HIDE_DELAY_MS + EXPLODE_AT_MS + NAV_AFTER_EXPLODE_MS
		this.after(navigateAt, () => {
			void this.router.navigate(this.navigateCommands())
		})
	}

	private clearTimers() {
		this.timers.forEach(clearTimeout)
		this.timers = []
	}

	private after(ms: number, fn: () => void) {
		this.timers.push(setTimeout(fn, ms))
	}

	private setColor(el: HTMLElement, color: string, durationMs: number) {
		el.style.transition = `color ${durationMs}ms ease`
		el.style.color = color
	}

	private getWarmupSpans(): { bt1: HTMLElement; bt2: HTMLElement; bHot: HTMLElement; bPrefix: HTMLElement } | undefined {
		const bt1 = this.bt1Span()?.nativeElement
		const bt2 = this.bt2Span()?.nativeElement
		const bHot = this.bHotSpan()?.nativeElement
		const bPrefix = this.bPrefixSpan()?.nativeElement
		if (!bt1 || !bt2 || !bHot || !bPrefix) {
			return undefined
		}
		return { bt1, bt2, bHot, bPrefix }
	}

	private startBrainWarmingSequence(attempt = 0): void {
		const warmup = this.getWarmupSpans()
		if (!warmup) {
			if (attempt < 30) {
				this.after(0, () => this.startBrainWarmingSequence(attempt + 1))
			}
			return
		}

		const { bt1, bt2, bHot, bPrefix } = warmup

		bt1.style.transition = 'none'
		bt1.style.color = LIGHT_GREY
		bt1.style.opacity = '0'
		bt2.style.transition = 'none'
		bt2.style.opacity = '0'
		bHot.style.transition = 'none'
		bHot.style.color = MID_GREY
		bHot.style.fontSize = `${BASE_FONT_PX}px`
		bPrefix.style.transition = 'none'
		bPrefix.style.color = MID_GREY
		bPrefix.style.fontSize = `${BASE_FONT_PX}px`
		bHot.classList.remove('brain-play-hot--shimmer')

		this.after(50, () => {
			const els = this.getWarmupSpans()
			if (!els?.bt1) {
				return
			}
			els.bt1.style.transition = 'opacity 400ms ease'
			els.bt1.style.opacity = '1'
		})

		this.after(0, () => {
			const els = this.getWarmupSpans()
			if (els?.bt1) this.setColor(els.bt1, LIGHT_GREY, 100)
		})
		this.after(PULSE_MS, () => {
			const els = this.getWarmupSpans()
			if (els?.bt1) this.setColor(els.bt1, WHITE, 700)
		})
		this.after(PULSE_MS * 2, () => {
			const els = this.getWarmupSpans()
			if (els?.bt1) this.setColor(els.bt1, LIGHT_GREY, 700)
		})
		this.after(PULSE_MS * 3, () => {
			const els = this.getWarmupSpans()
			if (els?.bt1) this.setColor(els.bt1, WHITE, 700)
		})

		this.after(CROSSFADE_AT_MS, () => {
			const els = this.getWarmupSpans()
			if (!els) {
				return
			}
			els.bt1.style.transition = `opacity ${CROSSFADE_MS}ms ease`
			els.bt1.style.opacity = '0'
			els.bHot.style.transition = 'none'
			els.bHot.style.color = MID_GREY
			els.bHot.style.fontSize = `${BASE_FONT_PX}px`
			els.bPrefix.style.transition = 'none'
			els.bPrefix.style.color = MID_GREY
			els.bPrefix.style.fontSize = `${BASE_FONT_PX}px`
			els.bt2.style.transition = `opacity ${CROSSFADE_MS}ms ease`
			els.bt2.style.opacity = '1'
		})

		this.after(PHASE2_START_MS, () => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const els = this.getWarmupSpans()
					if (!els) {
						return
					}
					els.bHot.style.transition = 'font-size 3.5s cubic-bezier(0.4, 0, 0.2, 1), color 3.5s ease'
					els.bHot.style.fontSize = `${HOT_BIG_PX}px`
					els.bHot.style.color = HOT_RED
					els.bPrefix.style.transition = 'font-size 3.5s cubic-bezier(0.4, 0, 0.2, 1)'
					els.bPrefix.style.fontSize = `${PREFIX_BIG_PX}px`
				})
			})
		})

		this.after(SHIMMER_AT_MS, () => {
			const els = this.getWarmupSpans()
			els?.bHot.classList.add('brain-play-hot--shimmer')
		})

		this.after(EXPLODE_AT_MS, () => {
			const els = this.getWarmupSpans()
			if (!els?.bHot) {
				return
			}
			els.bHot.classList.remove('brain-play-hot--shimmer')
			this.explodeHot(els.bHot, els.bt2)
		})
	}

	private explodeHot(bHot: HTMLElement, bt2: HTMLElement) {
		const rect = bHot.getBoundingClientRect()
		bt2.style.opacity = '0'

		const body = this.document.body

		for (let i = 0; i < 60; i++) {
			const idx = i
			const sp = this.document.createElement('div')
			sp.setAttribute('data-brain-play-particle', '1')
			const isLetter = idx < 12
			let w: number

			if (isLetter) {
				sp.style.fontFamily = 'inherit'
				sp.style.fontWeight = '600'
				const fs = Math.round(HOT_BIG_PX * (0.4 + Math.random() * 0.5))
				sp.style.fontSize = `${fs}px`
				sp.style.color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? HOT_RED
				sp.style.lineHeight = '1'
				sp.textContent = LETTER_SHARD[idx] ?? 'h'
				w = fs * 0.7
			} else {
				w = 6 + Math.random() * 14
				const h2 = 6 + Math.random() * 14
				sp.style.width = `${w}px`
				sp.style.height = `${h2}px`
				sp.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? HOT_RED
				sp.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
			}

			const sx = rect.left + Math.random() * rect.width - w / 2
			const sy = rect.top + Math.random() * rect.height - w / 2
			sp.style.position = 'fixed'
			sp.style.left = `${sx}px`
			sp.style.top = `${sy}px`
			sp.style.opacity = '1'
			sp.style.pointerEvents = 'none'
			sp.style.zIndex = '9999'
			body.appendChild(sp)

			const angle = Math.random() * Math.PI * 2
			const speed = 120 + Math.random() * 260
			const dx = Math.cos(angle) * speed
			const dy = Math.sin(angle) * speed - (40 + Math.random() * 80)
			const rot = (Math.random() - 0.5) * 720
			const dur = 600 + Math.random() * 700
			const delay = Math.random() * 120

			setTimeout(() => {
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						sp.style.transition = `transform ${dur}ms cubic-bezier(0.1, 0.2, 0.6, 1), opacity ${dur * 0.5}ms ease ${dur * 0.45}ms`
						sp.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(0.3)`
						sp.style.opacity = '0'
					})
				})
				setTimeout(() => {
					sp.remove()
				}, dur + 300)
			}, delay)
		}
	}

	private removeParticles() {
		this.document.querySelectorAll(PARTICLE_SELECTOR).forEach((p) => p.remove())
	}
}
