// src/lib/composables/useResizeObserver.ts

import { browser } from '$app/environment';

export interface ElementSize {
	width: number;
	height: number;
	x: number;
	y: number;
}

/**
 * A hook that observes an element's size changes using Svelte 5 runes
 * @param defaultSize Optional default dimensions to use before measuring
 * @returns An object with reactive size state and an action
 */
export function useResizeObserver(defaultSize: Partial<ElementSize> = {}) {
	const initialSize: ElementSize = {
		width: defaultSize.width || 0,
		height: defaultSize.height || 0,
		x: defaultSize.x || 0,
		y: defaultSize.y || 0
	};

	// Create reactive state for the element's dimensions
	let sizeState = $state<ElementSize>(initialSize);

	// Create a Svelte action for the resize observer
	function resizeObserver(node: HTMLElement) {
		// Only run in browser environment
		if (!browser) {
			return {
				destroy() {
					// No-op for SSR
				}
			};
		}

		// Initialize with current dimensions if available
		const rect = node.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			sizeState = {
				width: rect.width,
				height: rect.height,
				x: rect.x,
				y: rect.y
			};
		}

		// Create observer
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect) {
					sizeState = {
						width: entry.contentRect.width,
						height: entry.contentRect.height,
						x: entry.contentRect.x,
						y: entry.contentRect.y
					};
				}
			}
		});

		// Start observing
		observer.observe(node);

		// Cleanup on component unmount
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	return {
		get size() {
			return sizeState;
		},
		resizeObserver
	};
}
