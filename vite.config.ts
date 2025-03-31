import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// vite.config.js
export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		force: true // Forces complete re-optimization on every server start
	}
});
