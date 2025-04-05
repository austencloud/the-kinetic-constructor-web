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

// Define event types
export type TabChangeEvent = {
	index: number;
	id: string;
};

export type SettingsChangeEvent = {
	background: string;
};

export type EventMap = {
	tabChange: TabChangeEvent;
	settingsChange: SettingsChangeEvent;
};

export type AppDispatch = <K extends keyof EventMap>(type: K, detail?: EventMap[K]) => void;

export const createActions = (eventDispatch: AppDispatch) => ({
	changeTab: (newTabIndex: number): Promise<void> => {
		return new Promise((resolve) => {
			store.dispatch(changeTab(newTabIndex));

			eventDispatch('tabChange', {
				index: newTabIndex,
				id: tabs[newTabIndex].id
			});

			// Animation timing
			setTimeout(resolve, 600);
		});
	},

	updateBackground: (newBackground: string) => {
		store.dispatch(updateBackground(newBackground));
		eventDispatch('settingsChange', { background: newBackground });
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
