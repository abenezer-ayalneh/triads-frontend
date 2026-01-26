import { Injectable } from '@angular/core'

@Injectable({
	providedIn: 'root',
})
export class AssetPreloadService {
	private readonly lottieFiles = [
		'lotties/loading-lottie.json',
		'lotties/how-to-play-lottie.json',
		'lotties/play-button-lottie.json',
		'lotties/correct-answer-lottie.json',
		'lotties/wrong-answer-lottie.json',
		'lotties/bubble-burst-confetti.json',
		'lotties/bubble-explosion.json',
		'lotties/bubble-lottie.json',
		'lotties/box-lottie.json',
		'lotties/pop-lottie.json',
	]

	private readonly soundFiles = ['sounds/ta-dah.mp3', 'sounds/three-pops.mp3', 'sounds/pop.mp3']

	private readonly imageFiles = [
		'images/main-background.jpg',
		'images/bubble.png',
		'images/turn-one.png',
		'images/turn-two.png',
		'images/turn-three.png',
		'images/lifesaver.svg',
	]

	/**
	 * Preloads all application assets (lotties, sounds, images) to improve user experience.
	 * This method runs asynchronously and doesn't block app initialization.
	 */
	preloadAssets(): void {
		// Preload lottie JSON files
		this.preloadLotties()

		// Preload sound files
		this.preloadSounds()

		// Preload images
		this.preloadImages()
	}

	/**
	 * Preloads all lottie animation JSON files using fetch API.
	 */
	private preloadLotties(): void {
		this.lottieFiles.forEach((file) => {
			fetch(file, { cache: 'force-cache' }).catch((error) => {
				// Silently fail - assets may not be critical for app initialization
				console.warn(`Failed to preload lottie file: ${file}`, error)
			})
		})
	}

	/**
	 * Preloads all sound files by creating Audio objects and loading them.
	 * This ensures sounds are cached and ready to play immediately.
	 */
	private preloadSounds(): void {
		this.soundFiles.forEach((file) => {
			const audio = new Audio()
			audio.preload = 'auto'
			audio.src = file
			audio.load()

			// Handle load errors gracefully
			audio.addEventListener('error', () => {
				console.warn(`Failed to preload sound file: ${file}`)
			})
		})
	}

	/**
	 * Preloads all image files using fetch API.
	 */
	private preloadImages(): void {
		this.imageFiles.forEach((file) => {
			fetch(file, { cache: 'force-cache' }).catch((error) => {
				// Silently fail - assets may not be critical for app initialization
				console.warn(`Failed to preload image file: ${file}`, error)
			})
		})
	}
}
