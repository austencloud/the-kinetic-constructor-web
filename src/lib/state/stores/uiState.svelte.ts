/**
 * UI State Management with Svelte 5 Runes
 *
 * Modern replacement for uiStore.ts using Svelte 5 runes
 */

import { browser } from '$app/environment';

/**
 * Interface for UI state
 */
export interface UIState {
	isLoading: boolean;
	activeTabIndex: number;
	isSettingsOpen: boolean;
	isFullScreen: boolean;
	windowWidth: number;
	windowHeight: number;
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	theme: 'light' | 'dark' | 'system';
	sidebarOpen: boolean;
}

/**
 * Create reactive UI state with Svelte 5 runes
 */
export function createUIState() {
	let state = $state<UIState>({
		isLoading: true,
		activeTabIndex: 0,
		isSettingsOpen: false,
		isFullScreen: false,
		windowWidth: browser ? window.innerWidth : 1024,
		windowHeight: browser ? window.innerHeight : 768,
		isMobile: browser ? window.innerWidth < 768 : false,
		isTablet: browser ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
		isDesktop: browser ? window.innerWidth >= 1024 : true,
		theme: 'system',
		sidebarOpen: true
	});

	// Derived states
	const isSmallScreen = $derived(state.windowWidth < 640);
	const isMediumScreen = $derived(state.windowWidth >= 640 && state.windowWidth < 1024);
	const isLargeScreen = $derived(state.windowWidth >= 1024);
	const aspectRatio = $derived(state.windowWidth / state.windowHeight);
	const isLandscape = $derived(aspectRatio > 1);
	const isPortrait = $derived(aspectRatio <= 1);

	return {
		// State getters
		get state() {
			return state;
		},
		get isLoading() {
			return state.isLoading;
		},
		get activeTabIndex() {
			return state.activeTabIndex;
		},
		get isSettingsOpen() {
			return state.isSettingsOpen;
		},
		get isFullScreen() {
			return state.isFullScreen;
		},
		get windowWidth() {
			return state.windowWidth;
		},
		get windowHeight() {
			return state.windowHeight;
		},
		get isMobile() {
			return state.isMobile;
		},
		get isTablet() {
			return state.isTablet;
		},
		get isDesktop() {
			return state.isDesktop;
		},
		get theme() {
			return state.theme;
		},
		get sidebarOpen() {
			return state.sidebarOpen;
		},

		// Derived getters
		get isSmallScreen() {
			return isSmallScreen;
		},
		get isMediumScreen() {
			return isMediumScreen;
		},
		get isLargeScreen() {
			return isLargeScreen;
		},
		get aspectRatio() {
			return aspectRatio;
		},
		get isLandscape() {
			return isLandscape;
		},
		get isPortrait() {
			return isPortrait;
		},

		// State setters
		setLoading: (isLoading: boolean) => {
			state.isLoading = isLoading;
		},

		setActiveTab: (index: number) => {
			state.activeTabIndex = index;
		},

		toggleSettings: () => {
			state.isSettingsOpen = !state.isSettingsOpen;
		},

		setSettingsOpen: (isOpen: boolean) => {
			state.isSettingsOpen = isOpen;
		},

		toggleFullScreen: () => {
			state.isFullScreen = !state.isFullScreen;
		},

		setFullScreen: (isFullScreen: boolean) => {
			state.isFullScreen = isFullScreen;
		},

		updateWindowDimensions: (width: number, height: number) => {
			state.windowWidth = width;
			state.windowHeight = height;
			state.isMobile = width < 768;
			state.isTablet = width >= 768 && width < 1024;
			state.isDesktop = width >= 1024;
		},

		setTheme: (theme: 'light' | 'dark' | 'system') => {
			state.theme = theme;

			// Apply theme to document
			if (browser && typeof document !== 'undefined') {
				if (theme === 'system') {
					const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
					document.documentElement.classList.toggle('dark', prefersDark);
				} else {
					document.documentElement.classList.toggle('dark', theme === 'dark');
				}
			}
		},

		toggleSidebar: () => {
			state.sidebarOpen = !state.sidebarOpen;
		},

		setSidebarOpen: (isOpen: boolean) => {
			state.sidebarOpen = isOpen;
		},

		// Complex operations
		enterFullScreen: async () => {
			if (browser && document.documentElement.requestFullscreen) {
				try {
					await document.documentElement.requestFullscreen();
					state.isFullScreen = true;
				} catch (error) {
					console.error('Failed to enter fullscreen:', error);
				}
			}
		},

		exitFullScreen: async () => {
			if (browser && document.exitFullscreen) {
				try {
					await document.exitFullscreen();
					state.isFullScreen = false;
				} catch (error) {
					console.error('Failed to exit fullscreen:', error);
				}
			}
		},

		// Auto-close sidebar on mobile when navigating
		autoCloseSidebarOnMobile: () => {
			if (state.isMobile && state.sidebarOpen) {
				state.sidebarOpen = false;
			}
		},

		reset: () => {
			state = {
				isLoading: true,
				activeTabIndex: 0,
				isSettingsOpen: false,
				isFullScreen: false,
				windowWidth: browser ? window.innerWidth : 1024,
				windowHeight: browser ? window.innerHeight : 768,
				isMobile: browser ? window.innerWidth < 768 : false,
				isTablet: browser ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
				isDesktop: browser ? window.innerWidth >= 1024 : true,
				theme: 'system',
				sidebarOpen: true
			};
		}
	};
}

/**
 * Global UI state instance
 */
export const uiState = createUIState();

/**
 * Setup UI effects and event listeners
 */
export function setupUIEffects() {
	if (!browser) return;

	// Window resize listener
	$effect(() => {
		const handleResize = () => {
			uiState.updateWindowDimensions(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	// Theme change listener
	$effect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleThemeChange = () => {
			if (uiState.theme === 'system') {
				document.documentElement.classList.toggle('dark', mediaQuery.matches);
			}
		};

		mediaQuery.addEventListener('change', handleThemeChange);
		return () => mediaQuery.removeEventListener('change', handleThemeChange);
	});

	// Fullscreen change listener
	$effect(() => {
		const handleFullscreenChange = () => {
			uiState.setFullScreen(!!document.fullscreenElement);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
	});

	// Auto-close sidebar on mobile when clicking outside
	$effect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (uiState.isMobile && uiState.sidebarOpen) {
				const target = event.target as Element;
				const sidebar = document.querySelector('[data-sidebar]');
				const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
				
				if (sidebar && !sidebar.contains(target) && !sidebarToggle?.contains(target)) {
					uiState.setSidebarOpen(false);
				}
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
}
