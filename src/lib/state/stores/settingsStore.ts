/**
 * Legacy Settings Store Compatibility Layer
 *
 * This file provides backward compatibility for components still importing
 * from the old settingsStore path.
 *
 * TODO: Update all imports to use the new path and remove this file
 */

// Import and re-export from the modern settings module
import {
	settings,
	settingsStore as modernSettingsStore,
	type SettingsState,
	type GeneratorType,
	type PropContinuityType,
	type CAPType,
	getGeneratorType,
	getNumBeats,
	getTurnIntensity,
	getPropContinuity,
	getCapType,
	getLevel,
	getTheme,
	getAnimationsEnabled,
	settingsState
} from '../settings.svelte';

// Re-export everything for backward compatibility
export {
	settings,
	modernSettingsStore as settingsStore,
	type SettingsState,
	type GeneratorType,
	type PropContinuityType,
	type CAPType,
	getGeneratorType,
	getNumBeats,
	getTurnIntensity,
	getPropContinuity,
	getCapType,
	getLevel,
	getTheme,
	getAnimationsEnabled,
	settingsState
};
