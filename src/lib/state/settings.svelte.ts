/**
 * Modern Settings State - SVELTE 5 RUNES ONLY!
 *
 * This module provides modern settings state management using pure Svelte 5 runes.
 * NO STORES - RUNES ONLY!
 */

import { browser } from '$app/environment';

// Generator types
export type GeneratorType = 'circular' | 'freeform';
export type PropContinuityType = 'continuous' | 'random';
export type CAPType =
	| 'mirrored'
	| 'rotated'
	| 'mirrored_complementary'
	| 'rotated_complementary'
	| 'mirrored_swapped'
	| 'rotated_swapped'
	| 'strict_mirrored'
	| 'strict_rotated'
	| 'strict_complementary'
	| 'strict_swapped'
	| 'swapped_complementary';

// Settings interface
export interface SettingsState {
	// Generator settings
	generatorType: GeneratorType;
	numBeats: number;
	turnIntensity: number; // Scale of 1-5
	propContinuity: PropContinuityType;
	capType: CAPType;
	level: number; // Difficulty level 1-5

	// UI preferences
	theme: 'light' | 'dark' | 'system';
	animationsEnabled: boolean;
	hapticFeedback: boolean;

	// User preferences
	lastUsedGeneratorType: GeneratorType;
	favoriteCapTypes: CAPType[];
}

// Default settings
const DEFAULT_SETTINGS: SettingsState = {
	generatorType: 'circular',
	numBeats: 8,
	turnIntensity: 2,
	propContinuity: 'continuous',
	capType: 'mirrored',
	level: 1,
	theme: 'system',
	animationsEnabled: true,
	hapticFeedback: true,
	lastUsedGeneratorType: 'circular',
	favoriteCapTypes: ['mirrored', 'rotated']
};

// Storage key
const SETTINGS_STORAGE_KEY = 'app_settings';

// Create reactive state with Svelte 5 runes - NO STORES!
let settingsState = $state<SettingsState>({ ...DEFAULT_SETTINGS });

// Persistence functions
function saveSettings() {
	if (browser) {
		try {
			localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsState));
		} catch (error) {
			console.warn('Failed to save settings to localStorage:', error);
		}
	}
}

function loadSettings() {
	if (browser) {
		try {
			const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				Object.assign(settingsState, { ...DEFAULT_SETTINGS, ...parsed });
			}
		} catch (error) {
			console.warn('Failed to load settings from localStorage:', error);
		}
	}
}

// Initialize settings on module load
if (browser) {
	loadSettings();
}

// Modern settings API - PURE RUNES, NO STORES!
export const settings = {
	// Get current state snapshot
	getSnapshot(): SettingsState {
		return { ...settingsState };
	},

	// Generator settings
	setGeneratorType(type: GeneratorType) {
		settingsState.generatorType = type;
		settingsState.lastUsedGeneratorType = type;
		saveSettings();
	},

	setNumBeats(beats: number) {
		settingsState.numBeats = Math.max(1, Math.min(32, beats));
		saveSettings();
	},

	setTurnIntensity(intensity: number) {
		settingsState.turnIntensity = Math.max(1, Math.min(5, intensity));
		saveSettings();
	},

	setPropContinuity(continuity: PropContinuityType) {
		settingsState.propContinuity = continuity;
		saveSettings();
	},

	setCAPType(capType: CAPType) {
		settingsState.capType = capType;
		saveSettings();
	},

	setLevel(level: number) {
		settingsState.level = Math.max(1, Math.min(5, level));
		saveSettings();
	},

	// UI preferences
	setTheme(theme: 'light' | 'dark' | 'system') {
		settingsState.theme = theme;
		saveSettings();
	},

	setAnimationsEnabled(enabled: boolean) {
		settingsState.animationsEnabled = enabled;
		saveSettings();
	},

	setHapticFeedback(enabled: boolean) {
		settingsState.hapticFeedback = enabled;
		saveSettings();
	},

	// User preferences
	addFavoriteCapType(capType: CAPType) {
		if (!settingsState.favoriteCapTypes.includes(capType)) {
			settingsState.favoriteCapTypes.push(capType);
			saveSettings();
		}
	},

	removeFavoriteCapType(capType: CAPType) {
		const index = settingsState.favoriteCapTypes.indexOf(capType);
		if (index > -1) {
			settingsState.favoriteCapTypes.splice(index, 1);
			saveSettings();
		}
	},

	// Reset to defaults
	resetSettings() {
		Object.assign(settingsState, { ...DEFAULT_SETTINGS });
		saveSettings();
	},

	// Reactive getters for individual settings
	get generatorType() {
		return settingsState.generatorType;
	},

	get numBeats() {
		return settingsState.numBeats;
	},

	get turnIntensity() {
		return settingsState.turnIntensity;
	},

	get propContinuity() {
		return settingsState.propContinuity;
	},

	get capType() {
		return settingsState.capType;
	},

	get level() {
		return settingsState.level;
	},

	get theme() {
		return settingsState.theme;
	},

	get animationsEnabled() {
		return settingsState.animationsEnabled;
	},

	get hapticFeedback() {
		return settingsState.hapticFeedback;
	},

	get lastUsedGeneratorType() {
		return settingsState.lastUsedGeneratorType;
	},

	get favoriteCapTypes() {
		return [...settingsState.favoriteCapTypes];
	}
};

// Export reactive getter functions (Svelte 5 requirement - can't export $derived directly)
export const getGeneratorType = () => settingsState.generatorType;
export const getNumBeats = () => settingsState.numBeats;
export const getTurnIntensity = () => settingsState.turnIntensity;
export const getPropContinuity = () => settingsState.propContinuity;
export const getCapType = () => settingsState.capType;
export const getLevel = () => settingsState.level;
export const getTheme = () => settingsState.theme;
export const getAnimationsEnabled = () => settingsState.animationsEnabled;

// Export the state for direct access if needed
export { settingsState };

// Legacy compatibility - export as settingsStore for backward compatibility during migration
export const settingsStore = settings;
