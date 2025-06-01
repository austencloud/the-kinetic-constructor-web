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
			'html2canvas',
			'lz-string'
		],
		exclude: [],
		esbuildOptions: {
			logLevel: 'error'
		},
		force: process.env.VITE_FORCE_OPTIMIZE === 'true'
	},
	build: {
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes('xstate')) {
						return 'xstate-vendor';
					}
					if (id.includes('node_modules')) {
						return 'vendor';
					}
				}
			}
		}
	},
	server: {
		port: 7734, // Unique port: "hELL" upside down
		host: true, // Allow external access
		hmr: {
			timeout: 120000,
			// ✨ Enhanced HMR with instant feedback
			overlay: true,
			clientPort: undefined,
			port: undefined
		},
		watch: {
			usePolling: false,
			interval: 100, // Faster file watching
			// ✨ Smart ignore patterns for better performance
			ignored: [
				'**/node_modules/**',
				'**/.git/**',
				'**/dist/**',
				'**/build/**',
				'**/coverage/**',
				'**/test-results/**',
				'**/playwright-report/**',
				'**/.vscode/**',
				'**/*.log'
			]
		},
		fs: {
			strict: false
		},
		// ✨ Pre-transform known dependencies for instant startup
		warmup: {
			clientFiles: ['./src/lib/**/*.svelte', './src/routes/**/*.svelte', './src/app.html']
		}
	},
	// ✨ Enhanced development experience
	define: {
		__DEV_MODE__: JSON.stringify(process.env.NODE_ENV === 'development'),
		__BUILD_TIME__: JSON.stringify(new Date().toISOString()),
		__MAGICAL_DEV__: JSON.stringify(true)
	},
	logLevel: 'error',
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: './src/setupTests.ts',
		include: ['src/**/*.test.ts'],
		exclude: ['src/**/*.bench.ts', 'src/**/EndToEndIntegration.test.ts'],
		benchmark: {
			include: ['src/**/*.bench.ts'],
			reporters: ['verbose'],
			outputFile: './bench/results.json'
		}
	}
});
