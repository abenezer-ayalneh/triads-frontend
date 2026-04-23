import { Directive, input, output } from '@angular/core'

const DEFAULT_STEP_DELAY_MS = 80
const DEFAULT_ANIMATION_DURATION_MS = 200
const POP_SCALE_FROM = 1
const POP_SCALE_TO = 1.25
const ANIMATION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * Animates a collection of elements disappearing one-by-one from the last index down to the first.
 * Optionally preserves the first element (useful when a "first letter" hint is active).
 *
 * Triggered imperatively via `play(targets)`. Honors `prefers-reduced-motion` by skipping the
 * animation and emitting events synchronously so callers can still clear their state per index.
 */
@Directive({
	selector: '[appReverseErase]',
	standalone: true,
})
export class ReverseErase {
	preserveFirst = input<boolean>(false)

	stepDelay = input<number>(DEFAULT_STEP_DELAY_MS)

	animationDuration = input<number>(DEFAULT_ANIMATION_DURATION_MS)

	letterErased = output<number>()

	finished = output<void>()

	private isPlaying = false

	/**
	 * Animates `targets` last → first. Resolves when the sequence is complete.
	 * Safe to call with an empty array (resolves immediately after firing `finished`).
	 */
	async play(targets: HTMLElement[]): Promise<void> {
		if (this.isPlaying) {
			return
		}
		this.isPlaying = true
		try {
			const stopIndex = this.preserveFirst() ? 1 : 0
			const lastIndex = targets.length - 1

			if (lastIndex < stopIndex) {
				this.finished.emit()
				return
			}

			if (this.shouldReduceMotion()) {
				for (let i = lastIndex; i >= stopIndex; i--) {
					this.letterErased.emit(i)
				}
				this.finished.emit()
				return
			}

			const perLetterPromises: Promise<void>[] = []
			for (let i = lastIndex; i >= stopIndex; i--) {
				const element = targets[i]
				const capturedIndex = i
				perLetterPromises.push(
					this.animateElementAway(element).then(() => {
						this.letterErased.emit(capturedIndex)
					}),
				)

				const isLastStep = i === stopIndex
				if (!isLastStep) {
					await this.wait(this.stepDelay())
				}
			}

			await Promise.all(perLetterPromises)
			// fill:forwards keeps opacity in the animation stack; clearing style alone is not enough.
			for (let i = stopIndex; i <= lastIndex; i++) {
				this.clearEraseEffect(targets[i])
			}
			this.finished.emit()
		} finally {
			this.isPlaying = false
		}
	}

	/** Drop WAAPI fill and inline opacity so targets become visible again for the next attempt. */
	private clearEraseEffect(element: HTMLElement): void {
		element.getAnimations().forEach((animation) => animation.cancel())
		element.style.removeProperty('opacity')
		element.removeAttribute('aria-hidden')
	}

	private animateElementAway(element: HTMLElement): Promise<void> {
		element.setAttribute('aria-hidden', 'true')
		const animation = element.animate(
			[
				{ opacity: 1, transform: `scale(${POP_SCALE_FROM})` },
				{ opacity: 0, transform: `scale(${POP_SCALE_TO})` },
			],
			{
				duration: this.animationDuration(),
				easing: ANIMATION_EASING,
				fill: 'forwards',
			},
		)
		return new Promise((resolve) => {
			animation.onfinish = () => {
				element.style.opacity = '0'
				resolve()
			}
			animation.oncancel = () => resolve()
		})
	}

	private shouldReduceMotion(): boolean {
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
			return false
		}
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches
	}

	private wait(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}
}
