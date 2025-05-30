/**
 * Settings State - Pure Svelte 5 Runes
 * NO STORES - RUNES ONLY!
 */

import { browser } from '$app/environment';

export type GeneratorType = 'freeform' | 'structured' | 'guided';
export type CAPType = 'cap' | 'no_cap';
export type PropContinuityType = 'continuous' | 'random';

// Load settings from localStorage
function loadSettings() {
	if (!browser) return getDefaultSettings();
	
	try {
		const saved = localStorage.getItem('app-settings');
		if (saved) {
			return { ...getDefaultSettings(), ...JSON.parse(saved) };
		}
	} catch (error) {
		console.warn('Failed to load settings:', error);
	}
	
	return getDefaultSettings();
}

function getDefaultSettings() {
	return {
		generatorType: 'freeform' as GeneratorType,
		numBeats: 8,
		turnIntensity: 3,
		propContinuity: 'continuous' as PropContinuityType,
		capType: 'cap' as CAPType,
		level: 1,
		theme: 'dark',
		animationsEnabled: true,
		hapticFeedback: true,
		lastUsedGeneratorType: 'freeform' as GeneratorType,
		favoriteCapTypes: ['cap'] as CAPType[]
	};
}

// Pure runes state - no stores!
const initialSettings = loadSettings();
let generatorType = $state<GeneratorType>(initialSettings.generatorType);
let numBeats = $state(initialSettings.numBeats);
let turnIntensity = $state(initialSettings.turnIntensity);
let propContinuity = $state<PropContinuityType>(initialSettings.propContinuity);
let capType = $state<CAPType>(initialSettings.capType);
let level = $state(initialSettings.level);
let theme = $state(initialSettings.theme);
let animationsEnabled = $state(initialSettings.animationsEnabled);
let hapticFeedback = $state(initialSettings.hapticFeedback);
let lastUsedGeneratorType = $state<GeneratorType>(initialSettings.lastUsedGeneratorType);
let favoriteCapTypes = $state<CAPType[]>(initialSettings.favoriteCapTypes);

// Save to localStorage
function saveSettings() {
	if (!browser) return;
	
	try {
		const settings = {
			generatorType,
			numBeats,
			turnIntensity,
			propContinuity,
			capType,
			level,
			theme,
			animationsEnabled,
			hapticFeedback,
			lastUsedGeneratorType,
			favoriteCapTypes
		};
		localStorage.setItem('app-settings', JSON.stringify(settings));
	} catch (error) {
		console.warn('Failed to save settings:', error);
	}
}

/**
 * Settings State - Pure Runes API
 */
export const settingsState = {
	// Getters
	get generatorType() { return generatorType; },
	get numBeats() { return numBeats; },
	get turnIntensity() { return turnIntensity; },
	get propContinuity() { return propContinuity; },
	get capType() { return capType; },
	get level() { return level; },
	get theme() { return theme; },
	get animationsEnabled() { return animationsEnabled; },
	get hapticFeedback() { return hapticFeedback; },
	get lastUsedGeneratorType() { return lastUsedGeneratorType; },
	get favoriteCapTypes() { return favoriteCapTypes; },

	// Actions
	setGeneratorType(type: GeneratorType) {
		generatorType = type;
		lastUsedGeneratorType = type;
		saveSettings();
	},

	setNumBeats(beats: number) {
		numBeats = beats;
		saveSettings();
	},

	setTurnIntensity(intensity: number) {
		turnIntensity = intensity;
		saveSettings();
	},

	setPropContinuity(continuity: PropContinuityType) {
		propContinuity = continuity;
		saveSettings();
	},

	setCapType(type: CAPType) {
		capType = type;
		saveSettings();
	},

	setLevel(newLevel: number) {
		level = newLevel;
		saveSettings();
	},

	setTheme(newTheme: string) {
		theme = newTheme;
		saveSettings();
	},

	setAnimationsEnabled(enabled: boolean) {
		animationsEnabled = enabled;
		saveSettings();
	},

	setHapticFeedback(enabled: boolean) {
		hapticFeedback = enabled;
		saveSettings();
	},

	addFavoriteCapType(type: CAPType) {
		if (!favoriteCapTypes.includes(type)) {
			favoriteCapTypes = [...favoriteCapTypes, type];
			saveSettings();
		}
	},

	removeFavoriteCapType(type: CAPType) {
		favoriteCapTypes = favoriteCapTypes.filter(t => t !== type);
		saveSettings();
	},

	getSnapshot() {
		return {
			generatorType,
			numBeats,
			turnIntensity,
			propContinuity,
			capType,
			level,
			theme,
			animationsEnabled,
			hapticFeedback,
			lastUsedGeneratorType,
			favoriteCapTypes
		};
	},

	reset() {
		const defaults = getDefaultSettings();
		generatorType = defaults.generatorType;
		numBeats = defaults.numBeats;
		turnIntensity = defaults.turnIntensity;
		propContinuity = defaults.propContinuity;
		capType = defaults.capType;
		level = defaults.level;
		theme = defaults.theme;
		animationsEnabled = defaults.animationsEnabled;
		hapticFeedback = defaults.hapticFeedback;
		lastUsedGeneratorType = defaults.lastUsedGeneratorType;
		favoriteCapTypes = defaults.favoriteCapTypes;
		saveSettings();
	}
};

// Export for backward compatibility (but these should be replaced with direct runes usage)
export const settingsStore = settingsState;
