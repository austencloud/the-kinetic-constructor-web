// src/lib/components/MainWidget/state/appState.ts
import { writable, derived, type Readable } from 'svelte/store';
import type { ComponentType, SvelteComponent } from 'svelte';
import { beatsStore } from '$lib/stores/sequence/beatsStore';

// Define strict types but use 'any' for component type to avoid compatibility issues
export type TabComponentType = any;

// Define background types for better type safety
export type BackgroundType = 'snowfall' | 'particles' | 'gradient' | 'waves';
export type TabId = 'construct' | 'generate' | 'browse' | 'learn' | 'write';

// Then update your Tab interface to use this type
export type Tab = {
	id: TabId;
	component: TabComponentType | null;
	icon: string;
	title: string;
	splitView: boolean;
};
// Define the Tab type with flexible component typing


// Define the application state type
export interface AppState {
	isSettingsDialogOpen: boolean;
	isFullScreen: boolean;
	background: string;
	initializationError: boolean;
	currentTab: number;
	previousTab: number;
	contentVisible: boolean;
	dynamicHeight: string;
	transitionInProgress: boolean;
	contentFadeOut: boolean;
}

// Create the initial state
const initialState: AppState = {
	isSettingsDialogOpen: false,
	isFullScreen: false,
	background: 'Snowfall',
	initializationError: false,
	currentTab: 0,
	previousTab: 0,
	contentVisible: true,
	dynamicHeight: '100vh',
	transitionInProgress: false,
	contentFadeOut: false
};

// Define the tabs configuration
export const tabs: ReadonlyArray<Tab> = [
	{
		id: 'construct',
		component: null, // Will be set in MainWidget.svelte
		icon: '⚒️',
		title: 'Construct',
		splitView: true
	},
	{
		id: 'generate',
		component: null,
		icon: '🤖',
		title: 'Generate',
		splitView: false
	},
	{
		id: 'browse',
		component: null,
		icon: '🔍',
		title: 'Browse',
		splitView: false
	},
	{
		id: 'learn',
		component: null,
		icon: '🧠',
		title: 'Learn',
		splitView: false
	},
	{
		id: 'write',
		component: null,
		icon: '✍️',
		title: 'Write',
		splitView: false
	}
] as const;

// Create the writable store
export const appState = writable<AppState>(initialState);

// Create derived stores for commonly used values
export const activeTab: Readable<Tab> = derived(appState, ($state) => tabs[$state.currentTab]);

export const slideDirection: Readable<boolean> = derived(
	appState,
	($state) => $state.currentTab > $state.previousTab
);

export const isTabTransitionInProgress = derived(appState, ($state) => $state.transitionInProgress);

// OPTIONAL: Create a typed selector helper to access specific state slices
export const select = <K extends keyof AppState>(key: K): Readable<AppState[K]> => {
	return derived(appState, ($state) => $state[key]);
};