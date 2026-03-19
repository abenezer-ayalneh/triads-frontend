import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'org.gametrix',
	appName: 'Triads',
	webDir: './dist/triads/browser',
	android: { allowMixedContent: true },
	// server: {
	// 	androidScheme: 'https',
	// },
	plugins: {
		Keyboard: {
			resize: 'body',
			resizeOnFullScreen: true,
		},
	},
}

export default config
