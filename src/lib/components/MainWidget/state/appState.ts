// src/lib/components/MainWidget/state/appState.ts
import { writable, derived, type Readable, get } from 'svelte/store';
import type { ComponentType, SvelteComponent } from 'svelte';

// Define types with TypeScript template literals for more specific typing
export type BackgroundType = 'snowfall' | 'particles' | 'gradient' | 'waves';
export type TabId = 'construct' | 'generate' | 'browse' | 'learn' | 'write';

// Define the Tab type with more flexible component typing
export type Tab = {
	id: TabId;
	component: any | null; // Using 'any' for component to avoid type conflicts
	icon: string;
	title: string;
	splitView: boolean;
};

// Define the application state type
export interface AppState {
	isSettingsDialogOpen: boolean;
	isFullScreen: boolean;
	background: BackgroundType;
	initializationError: boolean;
	currentTab: number;
	previousTab: number;
	contentVisible: boolean;
	transitionInProgress: boolean;
	contentFadeOut: boolean;
}

// Create the initial state
const initialState: AppState = {
	isSettingsDialogOpen: false,
	isFullScreen: false,
	background: 'snowfall',
	initializationError: false,
	currentTab: 0,
	previousTab: 0,
	contentVisible: true,
	transitionInProgress: false,
	contentFadeOut: false
};

// Define the tabs configuration as a constant
export const TABS: ReadonlyArray<Tab> = [
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

// Create the app store with a custom store pattern for better encapsulation
function createAppStore() {
	const { subscribe, update, set } = writable<AppState>(initialState);
	
	return {
		subscribe,
		
		// Actions as methods on the store itself
		openSettings: () => update(state => ({ ...state, isSettingsDialogOpen: true })),
		
		closeSettings: () => update(state => ({ ...state, isSettingsDialogOpen: false })),
		
		updateBackground: (newBackground: BackgroundType) => 
			update(state => ({ ...state, background: newBackground })),
		
		setFullScreen: (isFullScreen: boolean) => 
			update(state => ({ ...state, isFullScreen })),
		
		setInitializationError: (hasError: boolean) => 
			update(state => ({ ...state, initializationError: hasError })),
		
		async changeTab(newTabIndex: number): Promise<void> {
			const currentState = get({ subscribe });
			
			// Skip if already on this tab
			if (newTabIndex === currentState.currentTab) {
				return;
			}
			
			// Start transition
			update(state => ({
				...state,
				previousTab: state.currentTab,
				transitionInProgress: true,
				contentFadeOut: true
			}));
			
			// Use async/await with Promise for better readability
			await new Promise(resolve => setTimeout(resolve, 300)); // Match fade duration
			
			// Switch tabs after fade-out
			update(state => ({
				...state,
				currentTab: newTabIndex,
				contentFadeOut: false
			}));
			
			// Complete transition after animation completes
			await new Promise(resolve => setTimeout(resolve, 300));
			
			update(state => ({
				...state,
				transitionInProgress: false
			}));
		}
	};
}

// Create the store
export const appStore = createAppStore();

// Create derived stores for commonly used values
export const activeTab = derived(appStore, ($state) => TABS[$state.currentTab]);

export const slideDirection = derived(
	appStore,
	($state) => $state.currentTab > $state.previousTab
);

export const isTabTransitionInProgress = derived(appStore, ($state) => $state.transitionInProgress);