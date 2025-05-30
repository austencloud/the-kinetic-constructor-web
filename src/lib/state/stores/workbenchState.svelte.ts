// src/lib/state/stores/workbenchStore.svelte.ts
// Svelte 5 runes-based workbench store

interface WorkbenchState {
	toolsPanelOpen: boolean;
	activeTab: 'generate' | 'construct';
}

const initialState: WorkbenchState = {
	toolsPanelOpen: false,
	activeTab: 'construct'
};

// Create reactive state using Svelte 5 runes
export const workbenchState = $state<WorkbenchState>(initialState);

// Export getter functions for components that need to access the state
export function getWorkbenchState() {
	return workbenchState;
}

// Export action functions for updating state
export function setToolsPanelOpen(open: boolean) {
	workbenchState.toolsPanelOpen = open;
}

export function toggleToolsPanel() {
	workbenchState.toolsPanelOpen = !workbenchState.toolsPanelOpen;
}

export function setActiveTab(tab: 'generate' | 'construct') {
	workbenchState.activeTab = tab;
}

// Export derived state as functions (Svelte 5 requirement)
export function isGenerateTabActive() {
	return workbenchState.activeTab === 'generate';
}

export function isConstructTabActive() {
	return workbenchState.activeTab === 'construct';
}
