/**
 * Element Reference Store - MODERNIZED WITH RUNES
 *
 * A centralized system for managing DOM element references across components using PURE RUNES.
 * NO STORES - RUNES ONLY!
 */
import { browser } from '$app/environment';

export type ElementReferenceMap = {
	[key: string]: HTMLElement | null;
};

// MODERNIZED: Use runes instead of stores - NO STORES!
export let elementReferences = $state<ElementReferenceMap>({});

// Initialize references from localStorage if available
if (browser) {
	try {
		const storedKeys = localStorage.getItem('element-reference-keys');
		if (storedKeys) {
			const keys = JSON.parse(storedKeys) as string[];
			// Note: We can't restore actual DOM elements from localStorage,
			// but we can prepare the structure
		}
	} catch (error) {
		console.error('ElementReferenceStore: Error restoring references:', error);
	}
}

// MODERNIZED: Pure runes-based functions - NO STORES!

/**
 * Set an element reference by key
 */
export function setElement(key: string, element: HTMLElement | null): boolean {
	if (!element) {
		return false;
	}

	// MODERNIZED: Direct assignment with runes - NO STORES!
	elementReferences = { ...elementReferences, [key]: element };

	// Store the key in localStorage for persistence
	if (browser) {
		try {
			const currentKeys = Object.keys(elementReferences);
			localStorage.setItem('element-reference-keys', JSON.stringify(currentKeys));
		} catch (error) {
			console.error('ElementReferenceStore: Error storing reference keys:', error);
		}
	}

	// Also store in global fallback for maximum compatibility
	if (browser) {
		(window as any)[`__element_ref_${key}`] = element;
	}

	return true;
}

/**
 * Get an element reference by key
 */
export function getElement(key: string): HTMLElement | null {
	const element = elementReferences[key];

	// If not found in state, try global fallback
	if (!element && browser) {
		const globalFallback = (window as any)[`__element_ref_${key}`] as HTMLElement | null;
		if (globalFallback) {
			// Update the state with the fallback
			elementReferences = { ...elementReferences, [key]: globalFallback };
			return globalFallback;
		}
	}

	return element || null;
}

/**
 * Remove an element reference by key
 */
export function removeElement(key: string): void {
	const { [key]: _, ...rest } = elementReferences;
	elementReferences = rest;

	// Update localStorage
	if (browser) {
		try {
			const currentKeys = Object.keys(rest);
			localStorage.setItem('element-reference-keys', JSON.stringify(currentKeys));
		} catch (error) {
			console.error('ElementReferenceStore: Error updating reference keys:', error);
		}
	}

	// Also remove from global fallback
	if (browser) {
		delete (window as any)[`__element_ref_${key}`];
	}
}

/**
 * Clear all element references
 */
export function clearAll(): void {
	elementReferences = {};

	// Clear localStorage
	if (browser) {
		try {
			localStorage.removeItem('element-reference-keys');
		} catch (error) {
			console.error('ElementReferenceStore: Error clearing reference keys:', error);
		}
	}
}

// For backward compatibility, export a store-like object
export const elementReferenceStore = {
	setElement,
	getElement,
	removeElement,
	clearAll,
	get references() {
		return elementReferences;
	}
};

// Constants for common element keys
export const ELEMENT_KEYS = {
	BEAT_FRAME: 'beatFrame',
	SEQUENCE_WIDGET: 'sequenceWidget',
	CURRENT_WORD_LABEL: 'currentWordLabel'
};
