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
