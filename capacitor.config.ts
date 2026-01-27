import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'com.triads.app',
	appName: 'Triads',
	webDir: 'dist/triads/browser',
	server: {
		androidScheme: 'https',
	},
	plugins: {
		App: {
			launchUrl: 'https://triads.app',
		},
	},
}

export default config
