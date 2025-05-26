/**
 * UI Store - MODERNIZED WITH RUNES
 *
 * This module provides pure Svelte 5 runes implementation.
 * NO STORES - RUNES ONLY!
 */

// Define the UI state interface
export interface UiState {
	activeTab: number;
	sidebarOpen: boolean;
	modalOpen: boolean;
	modalContent: string | null;
	theme: 'light' | 'dark' | 'system';
	isMobile: boolean;
	isLoading: boolean;
	// Window dimensions
	windowWidth: number;
	windowHeight: number;
	isDesktop: boolean;
}

// Initial state is now defined directly in the $state rune below

// Create reactive UI state with PURE RUNES - NO STORES!
export const uiState = $state<UiState>({
	activeTab: 0,
	sidebarOpen: false,
	modalOpen: false,
	modalContent: null,
	theme: 'system',
	isMobile: false,
	isLoading: false,
	// Window dimensions - default to reasonable values
	windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
	windowHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
	isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
});

// Pure runes-based actions - NO STORES!
export const uiActions = {
	// Tab actions
	setActiveTab: (tab: number) => {
		uiState.activeTab = tab;
	},

	// Sidebar actions
	openSidebar: () => {
		uiState.sidebarOpen = true;
	},
	closeSidebar: () => {
		uiState.sidebarOpen = false;
	},
	toggleSidebar: () => {
		uiState.sidebarOpen = !uiState.sidebarOpen;
	},

	// Modal actions
	openModal: (content: string) => {
		uiState.modalOpen = true;
		uiState.modalContent = content;
	},
	closeModal: () => {
		uiState.modalOpen = false;
		uiState.modalContent = null;
	},

	// Theme actions
	setTheme: (theme: 'light' | 'dark' | 'system') => {
		uiState.theme = theme;
	},

	// Device actions
	setMobile: (isMobile: boolean) => {
		uiState.isMobile = isMobile;
	},

	// Loading actions
	setLoading: (isLoading: boolean) => {
		uiState.isLoading = isLoading;
	},

	// Window dimension actions
	updateWindowDimensions: (width: number, height: number) => {
		uiState.windowWidth = width;
		uiState.windowHeight = height;
		uiState.isDesktop = width >= 1024;
		uiState.isMobile = width < 768;
	},

	// Reset action
	reset: () => {
		uiState.activeTab = 0;
		uiState.sidebarOpen = false;
		uiState.modalOpen = false;
		uiState.modalContent = null;
		uiState.theme = 'system';
		uiState.isMobile = false;
		uiState.isLoading = false;
		uiState.windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
		uiState.windowHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
		uiState.isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
	}
};

// DEPRECATED: Legacy store compatibility removed
// All functionality is now handled by pure runes above

// For backward compatibility, create a subscribable store-like object
export const uiStore = {
	// Expose state properties directly for $uiStore.property access
	get activeTab() {
		return uiState.activeTab;
	},
	get sidebarOpen() {
		return uiState.sidebarOpen;
	},
	get modalOpen() {
		return uiState.modalOpen;
	},
	get modalContent() {
		return uiState.modalContent;
	},
	get theme() {
		return uiState.theme;
	},
	get isMobile() {
		return uiState.isMobile;
	},
	get isLoading() {
		return uiState.isLoading;
	},
	get windowWidth() {
		return uiState.windowWidth;
	},
	get windowHeight() {
		return uiState.windowHeight;
	},
	get isDesktop() {
		return uiState.isDesktop;
	},

	// Include all actions
	...uiActions,

	// Add a subscribe method for store compatibility
	subscribe(callback: (state: UiState) => void) {
		// Call immediately with current state
		callback(uiState);

		// Return unsubscribe function (no-op for runes)
		return () => {};
	}
};
