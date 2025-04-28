import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
// PWA plugin temporarily disabled
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		// PWA plugin temporarily disabled
		/*
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.png', 'social_icons/*'],
			manifest: {
				name: 'The Kinetic Constructor',
				short_name: 'KineticConst',
				description: 'Web application for kinetic construction',
				theme_color: '#0b1d2a',
				background_color: '#0b1d2a',
				display: 'standalone',
				start_url: '/',
				icons: []
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff,woff2}'],
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
				runtimeCaching: []
			}
		})
		*/
	],
	optimizeDeps: {
		include: [
			'clsx',
			'xstate',
			'@xstate/svelte',
			'lucide-svelte',
			'svelte/transition',
			'svelte/store',
			'svelte/motion'
		],
		exclude: [],
		esbuildOptions: {
			logLevel: 'error'
		}
	},
	logLevel: 'error',
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.ts',
		include: ['src/**/*.test.ts'],
		exclude: ['src/**/*.bench.ts'],
		benchmark: {
			include: ['src/**/*.bench.ts'],
			reporters: ['verbose'],
			outputFile: './bench/results.json'
		}
	}
});
