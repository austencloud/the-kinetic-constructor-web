// src/lib/components/MainWidget/state/store.ts
import { createActor } from 'xstate';
import { appStateMachine } from './appStateMachine';
import { tabs } from './appState'; // Keep if needed for selectors
import { useSelector as useXStateSelector } from '@xstate/svelte'; // Import the adapter's selector

// Create the XState actor (service)
export const appService = createActor(appStateMachine, {
	inspect: import.meta.env.DEV ? (event) => console.log(event) : undefined // Enable dev tools if in development
}).start();

// --- Selectors (using XState snapshot) ---

// Export the useSelector hook from the adapter directly
export const useSelector = useXStateSelector;

// Example: Selector for the entire state snapshot (less common to use directly)
// export const selectAppSnapshot = () => useXStateSelector(appService, snapshot => snapshot);

// Selector for the context object
export const selectAppContext = () => useXStateSelector(appService, (snapshot) => snapshot.context);

// Selector for specific context properties
export const selectIsSettingsOpen = () =>
	useXStateSelector(appService, (snapshot) => snapshot.context.isSettingsOpen);
export const selectBackground = () =>
	useXStateSelector(appService, (snapshot) => snapshot.context.background);
export const selectCurrentTab = () =>
	useXStateSelector(appService, (snapshot) => snapshot.context.currentTab);
export const selectPreviousTab = () =>
	useXStateSelector(appService, (snapshot) => snapshot.context.previousTab);
export const selectContentVisible = () =>
	useXStateSelector(appService, (snapshot) => snapshot.context.contentVisible);
export const selectInitializationError = () =>
	useXStateSelector(appService, (snapshot) => snapshot.context.initializationError);
export const selectLoadingProgress = () =>
	useXStateSelector(appService, (snapshot) => snapshot.context.loadingProgress);
export const selectLoadingMessage = () =>
	useXStateSelector(appService, (snapshot) => snapshot.context.loadingMessage);

// Selector to check current state
export const selectIsInitializing = () =>
	useXStateSelector(appService, (snapshot) => snapshot.matches('initializing'));
export const selectIsReady = () =>
	useXStateSelector(appService, (snapshot) => snapshot.matches('ready'));
export const selectHasInitializationFailed = () =>
	useXStateSelector(appService, (snapshot) => snapshot.matches('initializationFailed'));

// Selector for active tab data (using context)
export const selectActiveTabData = () =>
	useXStateSelector(appService, (snapshot) => tabs[snapshot.context.currentTab]);

// Selector for slide direction (using context)
export const selectSlideDirection = () =>
	useXStateSelector(
		appService,
		(snapshot) => snapshot.context.currentTab > snapshot.context.previousTab
	);

// Optional: Cleanup the service when the app closes (only in browser)
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		appService.stop();
	});
}
