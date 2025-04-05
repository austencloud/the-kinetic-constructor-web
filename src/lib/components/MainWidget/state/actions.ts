// src/lib/components/MainWidget/state/actions.ts
import { store } from './store';
import {
	changeTab,
	updateBackground,
	setFullScreen,
	openSettings,
	closeSettings,
	setInitializationError
} from './appSlice';
import { tabs } from './appState';

// Define event types more explicitly
export type TabChangeEventDetail = { 
    index: number; 
    id: string 
};

export type BackgroundChangeEventDetail = string;

export const createActions = (onTabChange: (event: TabChangeEventDetail) => void, onBackgroundChange: (background: BackgroundChangeEventDetail) => void) => ({
	changeTab: (newTabIndex: number): Promise<void> => {
		return new Promise((resolve) => {
			store.dispatch(changeTab(newTabIndex));

			onTabChange({
				index: newTabIndex,
				id: tabs[newTabIndex].id
			});

			// Animation timing
			setTimeout(resolve, 600);
		});
	},

	updateBackground: (newBackground: string) => {
		store.dispatch(updateBackground(newBackground));
		onBackgroundChange(newBackground);
	},

	setFullScreen: (isFullScreen: boolean) => {
		store.dispatch(setFullScreen(isFullScreen));
	},

	openSettings: () => {
		store.dispatch(openSettings());
	},

	closeSettings: () => {
		store.dispatch(closeSettings());
	},

	setInitializationError: (hasError: boolean) => {
		store.dispatch(setInitializationError(hasError));
	}
});