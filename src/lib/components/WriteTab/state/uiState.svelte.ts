/**
 * WriteTab UI State - Modern Svelte 5 runes-based UI state management
 */

import { browser } from '$app/environment';

// Create reactive UI state using Svelte 5 runes
class UIState {
	// Selection state
	selectedSequence = $state<number | null>(null);
	selectedBeat = $state<number | null>(null);

	// View state
	isFullScreen = $state(false);
	showGrid = $state(true);
	showCues = $state(true);

	// Browser panel state
	isBrowserPanelOpen = $state(true);
	browserPanelWidth = $state(300);

	// Scroll positions
	beatGridScroll = $state(0);
	cueScrollPosition = $state(0);

	// Grid settings
	cellSize = $state(80);

	// Modal states
	showConfirmDeletions = $state(true);

	// Layout state
	windowWidth = $state(browser ? window.innerWidth : 1024);
	windowHeight = $state(browser ? window.innerHeight : 768);

	// Loading states
	isLoading = $state(false);
	loadingMessage = $state('');

	constructor() {
		// Initialize window size tracking on client side
		if (browser) {
			this.initializeWindowTracking();
			this.loadFromStorage();
		}
	}

	private initializeWindowTracking() {
		const updateSize = () => {
			this.windowWidth = window.innerWidth;
			this.windowHeight = window.innerHeight;
		};

		window.addEventListener('resize', updateSize);
		updateSize(); // Set initial size
	}

	private loadFromStorage() {
		try {
			const saved = localStorage.getItem('write_tab_ui_state');
			if (saved) {
				const state = JSON.parse(saved);
				this.isBrowserPanelOpen = state.isBrowserPanelOpen ?? true;
				this.browserPanelWidth = state.browserPanelWidth ?? 300;
				this.cellSize = state.cellSize ?? 80;
				this.showConfirmDeletions = state.showConfirmDeletions ?? true;
			}
		} catch (error) {
			console.error('Failed to load UI state:', error);
		}
	}

	private saveToStorage() {
		if (!browser) return;

		try {
			const state = {
				isBrowserPanelOpen: this.isBrowserPanelOpen,
				browserPanelWidth: this.browserPanelWidth,
				cellSize: this.cellSize,
				showConfirmDeletions: this.showConfirmDeletions
			};
			localStorage.setItem('write_tab_ui_state', JSON.stringify(state));
		} catch (error) {
			console.error('Failed to save UI state:', error);
		}
	}

	// Selection actions
	selectSequence(sequenceIndex: number | null) {
		this.selectedSequence = sequenceIndex;
		this.selectedBeat = null; // Clear beat selection when sequence changes
	}

	selectBeat(beatIndex: number | null) {
		this.selectedBeat = beatIndex;
	}

	clearSelection() {
		this.selectedSequence = null;
		this.selectedBeat = null;
	}

	// View actions
	toggleFullScreen() {
		this.isFullScreen = !this.isFullScreen;
	}

	setFullScreen(fullScreen: boolean) {
		this.isFullScreen = fullScreen;
	}

	toggleGrid() {
		this.showGrid = !this.showGrid;
	}

	toggleCues() {
		this.showCues = !this.showCues;
	}

	// Browser panel actions
	toggleBrowserPanel() {
		this.isBrowserPanelOpen = !this.isBrowserPanelOpen;
		this.saveToStorage();
	}

	setBrowserPanelOpen(isOpen: boolean) {
		this.isBrowserPanelOpen = isOpen;
		this.saveToStorage();
	}

	setBrowserPanelWidth(width: number) {
		this.browserPanelWidth = width;
		this.saveToStorage();
	}

	// Scroll actions
	updateBeatGridScroll(position: number) {
		this.beatGridScroll = position;
	}

	updateCueScrollPosition(position: number) {
		this.cueScrollPosition = position;
	}

	syncScrollPositions(position: number) {
		this.beatGridScroll = position;
		this.cueScrollPosition = position;
	}

	// Grid settings
	updateCellSize(size: number) {
		this.cellSize = size;
		this.saveToStorage();
	}

	// Modal actions
	toggleConfirmDeletions(show?: boolean) {
		this.showConfirmDeletions = show !== undefined ? show : !this.showConfirmDeletions;
		this.saveToStorage();
	}

	// Window size actions
	updateWindowSize(width: number, height: number) {
		this.windowWidth = width;
		this.windowHeight = height;
	}

	// Loading actions
	setLoading(isLoading: boolean, message: string = '') {
		this.isLoading = isLoading;
		this.loadingMessage = message;
	}
}

// Create and export the singleton instance
export const uiState = new UIState();
