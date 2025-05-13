// src/lib/state/image-export-settings.ts
import { browser } from '$app/environment';
import { writable, type Writable, get } from 'svelte/store';

export interface ImageExportSettings {
	includeStartPosition: boolean;
	addUserInfo: boolean;
	addWord: boolean;
	addDifficultyLevel: boolean;
	addBeatNumbers: boolean;
	addReversalSymbols: boolean;
	combinedGrids: boolean;
	backgroundColor: string;
	quality: number;
}

// Default settings - enable all enhancement features by default
export const defaultImageExportSettings: ImageExportSettings = {
	includeStartPosition: true,
	addUserInfo: true,
	addWord: true,
	addDifficultyLevel: true, // Enable difficulty level indicator by default
	addBeatNumbers: true,
	addReversalSymbols: true,
	combinedGrids: false,
	backgroundColor: '#FFFFFF', // Use white background for better visibility
	quality: 0.92
};

// Create a writable store with the default settings
export const imageExportSettings: Writable<ImageExportSettings> = writable(
	structuredClone(defaultImageExportSettings)
);

// Use local storage to persist settings
export function loadImageExportSettings(): void {
	try {
		if (!browser) return;

		const savedSettings = localStorage.getItem('image-export-settings');
		if (savedSettings) {
			const parsed = JSON.parse(savedSettings);
			imageExportSettings.update((settings) => ({
				...settings,
				...parsed
			}));
		}
	} catch (error) {
		console.error('Failed to load image export settings', error);
	}
}

export function saveImageExportSettings(): void {
	try {
		if (!browser) return;

		// Get the current value from the store
		const currentSettings = get(imageExportSettings);

		localStorage.setItem('image-export-settings', JSON.stringify(currentSettings));
	} catch (error) {
		console.error('Failed to save image export settings', error);
	}
}

// Call this when app initializes
if (browser) {
	loadImageExportSettings();
	window.addEventListener('beforeunload', saveImageExportSettings);
}
