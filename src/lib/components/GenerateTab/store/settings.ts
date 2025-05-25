// src/lib/components/GenerateTab/store/settings.ts - Modern Svelte 5 Runes
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

// Default settings
const DEFAULT_SETTINGS = {
	generatorType: 'circular' as GeneratorType,
	numBeats: 8,
	turnIntensity: 2, // Scale of 1-5
	propContinuity: 'continuous' as PropContinuityType,
	capType: 'mirrored' as CAPType,
	level: 1 // Difficulty level 1-5
};

// Storage key
const SETTINGS_STORAGE_KEY = 'generate_settings';

// Create reactive state with Svelte 5 runes
export let settings = $state({ ...DEFAULT_SETTINGS });

// Derived values for individual settings
export const generatorType = $derived(settings.generatorType);
export const numBeats = $derived(settings.numBeats);
export const turnIntensity = $derived(settings.turnIntensity);
export const propContinuity = $derived(settings.propContinuity);
export const capType = $derived(settings.capType);
export const level = $derived(settings.level);

// Helper functions to update individual settings
export function setGeneratorType(type: GeneratorType) {
	settings.generatorType = type;
	saveSettings();
}

export function setNumBeats(beats: number) {
	if (beats < 1) beats = 1;
	if (beats > 32) beats = 32;
	settings.numBeats = beats;
	saveSettings();
}

export function setTurnIntensity(intensity: number) {
	if (intensity < 1) intensity = 1;
	if (intensity > 5) intensity = 5;
	settings.turnIntensity = intensity;
	saveSettings();
}

export function setPropContinuity(continuity: PropContinuityType) {
	settings.propContinuity = continuity;
	saveSettings();
}

export function setCAPType(type: CAPType) {
	settings.capType = type;
	saveSettings();
}

export function setLevel(newLevel: number) {
	if (newLevel < 1) newLevel = 1;
	if (newLevel > 5) newLevel = 5;
	settings.level = newLevel;
	saveSettings();
}

export function resetSettings() {
	Object.assign(settings, { ...DEFAULT_SETTINGS });
	saveSettings();
}

// Persistence functions
function saveSettings() {
	if (browser) {
		try {
			localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
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
				Object.assign(settings, { ...DEFAULT_SETTINGS, ...parsed });
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

// Export the modern settings API
export const settingsStore = {
	// For backward compatibility, provide a subscribe-like function
	subscribe: (callback: (value: typeof settings) => void) => {
		// This is a simplified compatibility layer
		callback(settings);
		return { unsubscribe: () => {} };
	},
	setGeneratorType,
	setNumBeats,
	setTurnIntensity,
	setPropContinuity,
	setCAPType,
	setLevel,
	resetSettings
};
