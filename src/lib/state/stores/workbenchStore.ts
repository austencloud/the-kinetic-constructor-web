import { writable } from 'svelte/store';
import type { GeneratorType } from './settingsStore';

interface WorkbenchState {
	toolsPanelOpen: boolean;
	activeTab: 'generate' | 'construct';
}

const initialState: WorkbenchState = {
	toolsPanelOpen: false,
	activeTab: 'construct' // Default to construct tab for UI transition testing
};

export const workbenchStore = writable<WorkbenchState>(initialState);
