// src/lib/state/image-export-settings.ts
import { browser } from '$app/environment';
import { writable, type Writable, get } from 'svelte/store';

export interface ImageExportSettings {
	// Export content options
	includeStartPosition: boolean;
	addUserInfo: boolean;
	addWord: boolean;
	addDifficultyLevel: boolean;
	addBeatNumbers: boolean;
	addReversalSymbols: boolean;

	// User information
	userName: string;
	customNote: string;

	// Directory preferences
	rememberLastSaveDirectory: boolean;
	lastSaveDirectory: string;
}

// Default settings - enable all enhancement features by default
export const defaultImageExportSettings: ImageExportSettings = {
	// Export content options
	includeStartPosition: true,
	addUserInfo: true,
	addWord: true,
	addDifficultyLevel: true, // Enable difficulty level indicator by default
	addBeatNumbers: true,
	addReversalSymbols: true,

	// User information
	userName: 'User', // Default user name
	customNote: 'Created with The Kinetic Constructor', // Default note

	// Directory preferences
	rememberLastSaveDirectory: true,
	lastSaveDirectory: ''
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

				// Check if parsed is an object
				if (!parsed || typeof parsed !== 'object') {
					throw new Error('Parsed settings is not an object');
				}

				// Validate the parsed settings to ensure they're valid
				const validatedSettings: Partial<ImageExportSettings> = {};
				let validationErrors = 0;

				// Only include valid boolean properties with fallbacks
				validatedSettings.includeStartPosition =
					typeof parsed.includeStartPosition === 'boolean'
						? parsed.includeStartPosition
						: defaultImageExportSettings.includeStartPosition;

				validatedSettings.addUserInfo =
					typeof parsed.addUserInfo === 'boolean'
						? parsed.addUserInfo
						: defaultImageExportSettings.addUserInfo;

				validatedSettings.addWord =
					typeof parsed.addWord === 'boolean' ? parsed.addWord : defaultImageExportSettings.addWord;

				validatedSettings.addDifficultyLevel =
					typeof parsed.addDifficultyLevel === 'boolean'
						? parsed.addDifficultyLevel
						: defaultImageExportSettings.addDifficultyLevel;

				validatedSettings.addBeatNumbers =
					typeof parsed.addBeatNumbers === 'boolean'
						? parsed.addBeatNumbers
						: defaultImageExportSettings.addBeatNumbers;

				validatedSettings.addReversalSymbols =
					typeof parsed.addReversalSymbols === 'boolean'
						? parsed.addReversalSymbols
						: defaultImageExportSettings.addReversalSymbols;

				// Note: combinedGrids has been removed from the settings

				// Validate user information
				validatedSettings.userName =
					typeof parsed.userName === 'string' && parsed.userName.trim() !== ''
						? parsed.userName
						: defaultImageExportSettings.userName;

				validatedSettings.customNote =
					typeof parsed.customNote === 'string'
						? parsed.customNote
						: defaultImageExportSettings.customNote;

				// Validate directory preferences
				validatedSettings.rememberLastSaveDirectory =
					typeof parsed.rememberLastSaveDirectory === 'boolean'
						? parsed.rememberLastSaveDirectory
						: defaultImageExportSettings.rememberLastSaveDirectory;

				validatedSettings.lastSaveDirectory =
					typeof parsed.lastSaveDirectory === 'string'
						? parsed.lastSaveDirectory
						: defaultImageExportSettings.lastSaveDirectory;

				// Log validation results
				if (validationErrors > 0) {
					console.warn(
						`Image export settings loaded with ${validationErrors} validation errors, using fallbacks`
					);
				} else {
					console.log('Image export settings loaded successfully', validatedSettings);
				}

				// Update the store with validated settings
				imageExportSettings.update((settings) => ({
					...settings,
					...validatedSettings
				}));
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
			// Export content options
			includeStartPosition: !!currentSettings.includeStartPosition,
			addUserInfo: !!currentSettings.addUserInfo,
			addWord: !!currentSettings.addWord,
			addDifficultyLevel: !!currentSettings.addDifficultyLevel,
			addBeatNumbers: !!currentSettings.addBeatNumbers,
			addReversalSymbols: !!currentSettings.addReversalSymbols,

			// User information
			userName: currentSettings.userName || defaultImageExportSettings.userName,
			customNote: currentSettings.customNote || defaultImageExportSettings.customNote,

			// Directory preferences
			rememberLastSaveDirectory: !!currentSettings.rememberLastSaveDirectory,
			lastSaveDirectory: currentSettings.lastSaveDirectory || ''
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
