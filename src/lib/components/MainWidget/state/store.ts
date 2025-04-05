// src/lib/components/MainWidget/state/store.ts
import { createActor } from 'xstate';
import { appStateMachine } from './appStateMachine';
import { tabs } from './appState'; // Import the tabs array configuration
import { useSelector as useXStateSelector } from '@xstate/svelte'; // Import the Svelte adapter hook

// Create and start the XState actor (service)
export const appService = createActor(appStateMachine, {
	// Enable XState DevTools inspection in development environment
	inspect: import.meta.env.DEV ? (event) => console.log(event) : undefined
}).start();

// --- Selectors (using XState snapshot via @xstate/svelte) ---

// Export the useSelector hook directly for use in components
export const useSelector = useXStateSelector;

// Keep other selectors as previously defined...
export const selectAppContext = () => useXStateSelector(appService, (snapshot) => snapshot.context);
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
export const selectIsLoading = () =>
	useXStateSelector(
		appService,
		(snapshot) => snapshot.matches('initializingBackground') || snapshot.matches('initializingApp')
	);
export const selectIsInitializingApp = () =>
	useXStateSelector(appService, (snapshot) => snapshot.matches('initializingApp'));
export const selectIsReady = () =>
	useXStateSelector(appService, (snapshot) => snapshot.matches('ready'));
export const selectHasInitializationFailed = () =>
	useXStateSelector(appService, (snapshot) => snapshot.matches('initializationFailed'));
export const selectSlideDirection = () =>
	useXStateSelector(
		appService,
		(snapshot) => snapshot.context.currentTab > snapshot.context.previousTab
	);

// --- Selector for active tab data (ADD DETAILED LOGGING) ---
// This selector derives the specific Tab object based on the currentTab index in the context
export const selectActiveTabData = () =>
	useXStateSelector(appService, (snapshot) => {
		// Get the current tab index from the state machine's context
		const currentTabIndex = snapshot.context.currentTab;

		// --- Add Log ---
		// Log the index received from the snapshot
		console.log(
			`[Selector] selectActiveTabData: Received snapshot.context.currentTab = ${currentTabIndex}`
		);
		// --- End Log ---

		// Validate the index against the imported tabs array
		if (currentTabIndex >= 0 && currentTabIndex < tabs.length) {
			// If index is valid, get the corresponding tab object
			const activeTab = tabs[currentTabIndex];
			// --- Add Log ---
			// Log the tab data being returned
			console.log(
				`[Selector] selectActiveTabData: Returning tab data for index ${currentTabIndex}:`,
				activeTab
			);
			// --- End Log ---
			return activeTab; // Return the found tab object
		} else {
			// --- Add Log ---
			// Log an error if the index is out of bounds
			console.error(
				`[Selector] selectActiveTabData: Invalid currentTabIndex = ${currentTabIndex}. Returning null.`
			);
			// --- End Log ---
			return null; // Return null to indicate invalid state or data not found
		}
	});

// Optional: Cleanup the service when the browser window unloads
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		appService.stop();
	});
}
