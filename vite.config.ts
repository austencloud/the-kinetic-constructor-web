import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
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
				icons: [
					{
						src: 'pwa/icon-72x72.png',
						sizes: '72x72',
						type: 'image/png'
					},
					{
						src: 'pwa/icon-96x96.png',
						sizes: '96x96',
						type: 'image/png'
					},
					{
						src: 'pwa/icon-128x128.png',
						sizes: '128x128',
						type: 'image/png'
					},
					{
						src: 'pwa/icon-144x144.png',
						sizes: '144x144',
						type: 'image/png'
					},
					{
						src: 'pwa/icon-152x152.png',
						sizes: '152x152',
						type: 'image/png'
					},
					{
						src: 'pwa/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'pwa/icon-384x384.png',
						sizes: '384x384',
						type: 'image/png'
					},
					{
						src: 'pwa/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'pwa/maskable-icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'cdn-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			}
		})
	],
	optimizeDeps: {
		force: true
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.ts',
		include: ['src/**/*.test.ts']
	}
});
