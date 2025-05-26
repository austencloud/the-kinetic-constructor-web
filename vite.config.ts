import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit()
	],
	optimizeDeps: {
		include: [
			'clsx',
			'xstate',
			'@xstate/svelte',
			'svelte/transition',
			'lz-string' // Add lz-string to the optimized dependencies
		],
		exclude: [],
		esbuildOptions: {
			logLevel: 'error'
		},
		// Only force optimization when needed, not during regular development
		force: process.env.VITE_FORCE_OPTIMIZE === 'true'
	},
	// Increase build performance and avoid timeout issues
	build: {
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Group xstate related modules
					if (id.includes('xstate')) {
						return 'xstate-vendor';
					}
					// Group other vendor modules if needed
					if (id.includes('node_modules')) {
						return 'vendor';
					}
				}
			}
		}
	},
	// Increase server timeout for dependency optimization
	server: {
		port: 5179, // DEDICATED PORT for the-kinetic-constructor-web - ALWAYS USE 5179!
		strictPort: true, // STRICT: Always use port 5179, fail if not available
		open: 'http://localhost:5179', // Always open to the exact URL
		host: true, // Listen on all addresses (0.0.0.0)
		hmr: {
			port: 5179, // HMR also uses the same port
			timeout: 120000 // 120 seconds timeout for HMR
		},
		// Increase the timeout for dependency optimization
		watch: {
			usePolling: false, // Disable polling on Windows to reduce file system load
			interval: 1000
		},
		fs: {
			strict: false // Relax file system restrictions to help with Windows path issues
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
