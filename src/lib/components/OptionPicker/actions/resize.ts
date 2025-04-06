// src/lib/components/OptionPicker/actions/resize.ts
import type { Action } from 'svelte/action';

/**
 * A Svelte action that detects element resizing and calls the callback
 * with the new width and height
 */
export const resize: Action<HTMLElement, (width: number, height: number) => void> = (
	node,
	callback
) => {
	// Initial measurement
	if (callback && node) {
		const { width, height } = node.getBoundingClientRect();
		callback(width, height);
	}

	// Set up ResizeObserver if available
	let resizeObserver: ResizeObserver | undefined;

	if (typeof ResizeObserver !== 'undefined') {
		resizeObserver = new ResizeObserver((entries) => {
			if (!entries.length) return;

			const entry = entries[0];
			if (callback && entry.contentRect) {
				const { width, height } = entry.contentRect;
				callback(width, height);
			}
		});

		resizeObserver.observe(node);
	} else {
		// Fallback for browsers without ResizeObserver
		const handleResize = () => {
			if (callback && node) {
				const { width, height } = node.getBoundingClientRect();
				callback(width, height);
			}
		};

		window.addEventListener('resize', handleResize);

		return {
			destroy() {
				window.removeEventListener('resize', handleResize);
			}
		};
	}

	return {
		update(newCallback: (width: number, height: number) => void) {
			callback = newCallback;
		},

		destroy() {
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
		}
	};
};
