import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: [
			'clsx',
			'xstate',
			'@xstate/svelte',
			'lucide-svelte',
			'svelte/transition',
			'svelte/store',
			'svelte/motion',
			'html2canvas' // Add html2canvas to the optimized dependencies
		],
		exclude: [],
		esbuildOptions: {
			logLevel: 'error'
		},
		// Force Vite to always optimize html2canvas
		force: true
	},
	// Increase build performance and avoid timeout issues
	build: {
		// Increase chunk size limit to avoid splitting html2canvas
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks: {
					html2canvas: ['html2canvas']
				}
			}
		}
	},
	// Increase server timeout for dependency optimization
	server: {
		hmr: {
			timeout: 60000 // 60 seconds timeout for HMR
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
