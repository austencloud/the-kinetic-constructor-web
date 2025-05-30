/**
 * UI State - Pure Svelte 5 Runes
 * NO STORES - RUNES ONLY!
 */

// Global UI state using pure runes
let isMenuOpen = $state(false);
let isModalOpen = $state(false);
let modalContent = $state<any>(null);
let sidebarWidth = $state(300);
let browserPanelWidth = $state(400);
let isResizing = $state(false);
let selectedSection = $state(0);
let transitionLoading = $state(false);

/**
 * Global UI State - Pure Runes API
 */
export const uiState = {
	// Getters
	get isMenuOpen() {
		return isMenuOpen;
	},
	get isModalOpen() {
		return isModalOpen;
	},
	get modalContent() {
		return modalContent;
	},
	get sidebarWidth() {
		return sidebarWidth;
	},
	get browserPanelWidth() {
		return browserPanelWidth;
	},
	get isResizing() {
		return isResizing;
	},
	get selectedSection() {
		return selectedSection;
	},
	get transitionLoading() {
		return transitionLoading;
	},

	// Actions
	openMenu() {
		isMenuOpen = true;
	},

	closeMenu() {
		isMenuOpen = false;
	},

	toggleMenu() {
		isMenuOpen = !isMenuOpen;
	},

	openModal(content: any) {
		modalContent = content;
		isModalOpen = true;
	},

	closeModal() {
		isModalOpen = false;
		modalContent = null;
	},

	setSidebarWidth(width: number) {
		sidebarWidth = width;
	},

	setBrowserPanelWidth(width: number) {
		browserPanelWidth = width;
	},

	setResizing(resizing: boolean) {
		isResizing = resizing;
	},

	setSelectedSection(section: number) {
		selectedSection = section;
	},

	setTransitionLoading(loading: boolean) {
		transitionLoading = loading;
	},

	reset() {
		isMenuOpen = false;
		isModalOpen = false;
		modalContent = null;
		sidebarWidth = 300;
		isResizing = false;
		selectedSection = 0;
		transitionLoading = false;
	}
};

/**
 * Transition Loading State - Pure Runes API
 */
export const transitionLoadingState = {
	get isLoading() {
		return transitionLoading;
	},

	setLoading(loading: boolean) {
		transitionLoading = loading;
	}
};

// Export for backward compatibility (but these should be replaced with direct runes usage)
export const uiStore = uiState;
export const transitionLoadingStore = transitionLoadingState;
