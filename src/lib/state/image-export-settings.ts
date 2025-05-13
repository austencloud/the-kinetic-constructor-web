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
			try {
				const parsed = JSON.parse(savedSettings);

				// Validate the parsed settings to ensure they're valid
				const validatedSettings: Partial<ImageExportSettings> = {};

				// Only include valid boolean properties
				if (typeof parsed.includeStartPosition === 'boolean')
					validatedSettings.includeStartPosition = parsed.includeStartPosition;
				if (typeof parsed.addUserInfo === 'boolean')
					validatedSettings.addUserInfo = parsed.addUserInfo;
				if (typeof parsed.addWord === 'boolean') validatedSettings.addWord = parsed.addWord;
				if (typeof parsed.addDifficultyLevel === 'boolean')
					validatedSettings.addDifficultyLevel = parsed.addDifficultyLevel;
				if (typeof parsed.addBeatNumbers === 'boolean')
					validatedSettings.addBeatNumbers = parsed.addBeatNumbers;
				if (typeof parsed.addReversalSymbols === 'boolean')
					validatedSettings.addReversalSymbols = parsed.addReversalSymbols;
				if (typeof parsed.combinedGrids === 'boolean')
					validatedSettings.combinedGrids = parsed.combinedGrids;

				// Include other properties with type checking
				if (typeof parsed.backgroundColor === 'string')
					validatedSettings.backgroundColor = parsed.backgroundColor;
				if (typeof parsed.quality === 'number' && parsed.quality > 0 && parsed.quality <= 1)
					validatedSettings.quality = parsed.quality;

				// Update the store with validated settings
				imageExportSettings.update((settings) => ({
					...settings,
					...validatedSettings
				}));

				console.log('Image export settings loaded successfully', validatedSettings);
			} catch (parseError) {
				console.error('Failed to parse image export settings, using defaults', parseError);
				// Reset to defaults if parsing fails
				localStorage.removeItem('image-export-settings');
				imageExportSettings.set(structuredClone(defaultImageExportSettings));
			}
		}
	} catch (error) {
		console.error('Failed to load image export settings', error);
		// Reset to defaults if loading fails
		imageExportSettings.set(structuredClone(defaultImageExportSettings));
	}
}

export function saveImageExportSettings(): void {
	try {
		if (!browser) return;

		// Get the current value from the store
		const currentSettings = get(imageExportSettings);

		// Validate settings before saving
		if (!currentSettings) {
			console.error('Cannot save image export settings: settings object is null or undefined');
			return;
		}

		// Create a clean copy with only the expected properties
		const cleanSettings: ImageExportSettings = {
			includeStartPosition: !!currentSettings.includeStartPosition,
			addUserInfo: !!currentSettings.addUserInfo,
			addWord: !!currentSettings.addWord,
			addDifficultyLevel: !!currentSettings.addDifficultyLevel,
			addBeatNumbers: !!currentSettings.addBeatNumbers,
			addReversalSymbols: !!currentSettings.addReversalSymbols,
			combinedGrids: !!currentSettings.combinedGrids,
			backgroundColor:
				typeof currentSettings.backgroundColor === 'string'
					? currentSettings.backgroundColor
					: defaultImageExportSettings.backgroundColor,
			quality:
				typeof currentSettings.quality === 'number' &&
				currentSettings.quality > 0 &&
				currentSettings.quality <= 1
					? currentSettings.quality
					: defaultImageExportSettings.quality
		};

		localStorage.setItem('image-export-settings', JSON.stringify(cleanSettings));
		console.log('Image export settings saved successfully');
	} catch (error) {
		console.error('Failed to save image export settings', error);
	}
}

// Call this when app initializes
if (browser) {
	loadImageExportSettings();
	window.addEventListener('beforeunload', saveImageExportSettings);
}
