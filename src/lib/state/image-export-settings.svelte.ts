// src/lib/state/image-export-settings.ts
import { browser } from '$app/environment';

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

	// Category information for organizing exports
	useCategories: boolean;
	defaultCategory: string;
}

// Default settings - enable all enhancement features by default
export const defaultImageExportSettings: ImageExportSettings = {
	// Export content options
	includeStartPosition: true,
	addUserInfo: true,
	addWord: true,
	addDifficultyLevel: true,
	addBeatNumbers: true,
	addReversalSymbols: true,

	// User information
	userName: 'User',
	customNote: 'Created with The Kinetic Constructor',

	// Directory preferences
	rememberLastSaveDirectory: true,
	lastSaveDirectory: '',

	// Category information for organizing exports
	useCategories: true,
	defaultCategory: 'Sequences'
};

// Global state for image export settings
let imageExportState = $state(structuredClone(defaultImageExportSettings));

// Function to get the current settings
export function getImageExportSettings(): ImageExportSettings {
	// Create a plain object copy instead of using structuredClone
	// This avoids issues with Svelte 5 runes proxy objects
	return {
		// Export content options
		includeStartPosition: imageExportState.includeStartPosition === true,
		addUserInfo: imageExportState.addUserInfo === true,
		addWord: imageExportState.addWord === true,
		addDifficultyLevel: imageExportState.addDifficultyLevel === true,
		addBeatNumbers: imageExportState.addBeatNumbers === true,
		addReversalSymbols: imageExportState.addReversalSymbols === true,

		// User information
		userName: imageExportState.userName || defaultImageExportSettings.userName,
		customNote: imageExportState.customNote || defaultImageExportSettings.customNote,

		// Directory preferences
		rememberLastSaveDirectory: imageExportState.rememberLastSaveDirectory === true,
		lastSaveDirectory: imageExportState.lastSaveDirectory || '',

		// Category information
		useCategories: imageExportState.useCategories === true,
		defaultCategory: imageExportState.defaultCategory || defaultImageExportSettings.defaultCategory
	};
}

// Function to update the settings
export function updateImageExportSettings(newSettings: Partial<ImageExportSettings>): void {
	// Create a new object with strict boolean handling
	const cleanSettings = {
		...imageExportState,
		...newSettings
	};

	// Ensure strict boolean values for toggles
	cleanSettings.rememberLastSaveDirectory = cleanSettings.rememberLastSaveDirectory === true;
	cleanSettings.includeStartPosition = cleanSettings.includeStartPosition === true;
	cleanSettings.addUserInfo = cleanSettings.addUserInfo === true;
	cleanSettings.addWord = cleanSettings.addWord === true;
	cleanSettings.addDifficultyLevel = cleanSettings.addDifficultyLevel === true;
	cleanSettings.addBeatNumbers = cleanSettings.addBeatNumbers === true;
	cleanSettings.addReversalSymbols = cleanSettings.addReversalSymbols === true;
	cleanSettings.useCategories = cleanSettings.useCategories === true;

	// Update the state
	imageExportState = cleanSettings;

	// Save to localStorage
	saveImageExportSettings();
}

// Load settings from localStorage
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

				// Validate the parsed settings
				const validatedSettings: Partial<ImageExportSettings> = {};

				// Explicitly convert all boolean values
				validatedSettings.includeStartPosition = parsed.includeStartPosition === true;
				validatedSettings.addUserInfo = parsed.addUserInfo === true;
				validatedSettings.addWord = parsed.addWord === true;
				validatedSettings.addDifficultyLevel = parsed.addDifficultyLevel === true;
				validatedSettings.addBeatNumbers = parsed.addBeatNumbers === true;
				validatedSettings.addReversalSymbols = parsed.addReversalSymbols === true;

				// Very important: Strictly convert to boolean
				validatedSettings.rememberLastSaveDirectory = parsed.rememberLastSaveDirectory === true;

				// Log the loaded value for debugging
				console.log('Loaded directory preference values:', {
					rememberLastSaveDirectory: {
						parsedValue: parsed.rememberLastSaveDirectory,
						validatedValue: validatedSettings.rememberLastSaveDirectory,
						type: typeof validatedSettings.rememberLastSaveDirectory
					}
				});

				// String values with defaults
				validatedSettings.userName =
					typeof parsed.userName === 'string' && parsed.userName.trim() !== ''
						? parsed.userName
						: defaultImageExportSettings.userName;

				validatedSettings.customNote =
					typeof parsed.customNote === 'string'
						? parsed.customNote
						: defaultImageExportSettings.customNote;

				validatedSettings.lastSaveDirectory =
					typeof parsed.lastSaveDirectory === 'string'
						? parsed.lastSaveDirectory
						: defaultImageExportSettings.lastSaveDirectory;

				// More boolean values
				validatedSettings.useCategories = parsed.useCategories === true;

				validatedSettings.defaultCategory =
					typeof parsed.defaultCategory === 'string' && parsed.defaultCategory.trim() !== ''
						? parsed.defaultCategory
						: defaultImageExportSettings.defaultCategory;

				// Log validation success
				console.log('Image export settings loaded successfully', validatedSettings);

				// Update the state with validated settings
				imageExportState = {
					...defaultImageExportSettings,
					...validatedSettings
				};
			} catch (parseError) {
				console.error('Failed to parse image export settings, using defaults', parseError);
				// Reset to defaults if parsing fails
				localStorage.removeItem('image-export-settings');
				imageExportState = structuredClone(defaultImageExportSettings);
			}
		}
	} catch (error) {
		console.error('Failed to load image export settings', error);
		// Reset to defaults if loading fails
		imageExportState = structuredClone(defaultImageExportSettings);
	}
}

// Save settings to localStorage
export function saveImageExportSettings(): void {
	try {
		if (!browser) return;

		// Validate settings before saving
		if (!imageExportState) {
			console.error('Cannot save image export settings: settings object is null or undefined');
			return;
		}

		// Log the settings being saved
		console.log('Saving image export settings:', {
			rememberLastSaveDirectory: {
				value: imageExportState.rememberLastSaveDirectory,
				type: typeof imageExportState.rememberLastSaveDirectory,
				strictComparison: {
					true: imageExportState.rememberLastSaveDirectory === true,
					false: imageExportState.rememberLastSaveDirectory === false
				}
			}
		});

		// Create a clean copy with explicit boolean conversions
		// This avoids issues with Svelte 5 runes proxy objects
		const cleanSettings: ImageExportSettings = {
			// Export content options - explicitly convert to boolean
			includeStartPosition: imageExportState.includeStartPosition === true,
			addUserInfo: imageExportState.addUserInfo === true,
			addWord: imageExportState.addWord === true,
			addDifficultyLevel: imageExportState.addDifficultyLevel === true,
			addBeatNumbers: imageExportState.addBeatNumbers === true,
			addReversalSymbols: imageExportState.addReversalSymbols === true,

			// User information
			userName: imageExportState.userName || defaultImageExportSettings.userName,
			customNote: imageExportState.customNote || defaultImageExportSettings.customNote,

			// Directory preferences - explicitly convert to boolean
			rememberLastSaveDirectory: imageExportState.rememberLastSaveDirectory === true,
			lastSaveDirectory: imageExportState.lastSaveDirectory || '',

			// Category information - explicitly convert to boolean
			useCategories: imageExportState.useCategories === true,
			defaultCategory:
				imageExportState.defaultCategory || defaultImageExportSettings.defaultCategory
		};

		// Log the cleaned settings
		console.log('Cleaned image export settings to save:', {
			...cleanSettings,
			rememberLastSaveDirectory: cleanSettings.rememberLastSaveDirectory
		});

		// Save to localStorage
		localStorage.setItem('image-export-settings', JSON.stringify(cleanSettings));

		// Verify the settings were saved correctly
		try {
			const savedSettings = localStorage.getItem('image-export-settings');
			if (savedSettings) {
				const parsed = JSON.parse(savedSettings);
				console.log('Verified saved settings in localStorage:', {
					rememberLastSaveDirectory: {
						value: parsed.rememberLastSaveDirectory,
						type: typeof parsed.rememberLastSaveDirectory,
						originalValue: cleanSettings.rememberLastSaveDirectory,
						match: parsed.rememberLastSaveDirectory === cleanSettings.rememberLastSaveDirectory
					}
				});
			}
		} catch (verifyError) {
			console.error('Error verifying saved settings:', verifyError);
		}
	} catch (error) {
		console.error('Failed to save image export settings', error);
	}
}

// NOTE: Initialization is now handled by the SettingsManager.svelte component
// This prevents lifecycle methods from being called outside of component context
