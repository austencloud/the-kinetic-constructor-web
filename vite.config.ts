import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: ['chunk-YGTFLEU5', 'chunk-QCBUMAKQ', 'chunk-FDUFEXZF']
	}
});