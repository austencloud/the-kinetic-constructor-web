/**
 * Global UI State Management with Svelte 5 Runes
 * 
 * Modern replacement for the legacy uiStore using pure runes
 */

export interface GlobalUIState {
	isFullScreen: boolean;
	theme: 'light' | 'dark' | 'auto';
	sidebarOpen: boolean;
	modalStack: string[];
	notifications: Array<{
		id: string;
		type: 'info' | 'success' | 'warning' | 'error';
		message: string;
		timestamp: number;
	}>;
}

// Create reactive global UI state
let globalUIState = $state<GlobalUIState>({
	isFullScreen: false,
	theme: 'auto',
	sidebarOpen: true,
	modalStack: [],
	notifications: []
});

// Derived states
const hasModals = $derived(globalUIState.modalStack.length > 0);
const hasNotifications = $derived(globalUIState.notifications.length > 0);
const currentModal = $derived(globalUIState.modalStack[globalUIState.modalStack.length - 1] || null);

/**
 * Global UI Actions
 */
export const globalUIActions = {
	// Fullscreen management
	toggleFullScreen() {
		globalUIState.isFullScreen = !globalUIState.isFullScreen;
		
		// Handle browser fullscreen API
		if (typeof document !== 'undefined') {
			if (globalUIState.isFullScreen) {
				document.documentElement.requestFullscreen?.();
			} else {
				document.exitFullscreen?.();
			}
		}
	},

	setFullScreen(isFullScreen: boolean) {
		globalUIState.isFullScreen = isFullScreen;
	},

	// Theme management
	setTheme(theme: 'light' | 'dark' | 'auto') {
		globalUIState.theme = theme;
	},

	// Sidebar management
	toggleSidebar() {
		globalUIState.sidebarOpen = !globalUIState.sidebarOpen;
	},

	setSidebarOpen(isOpen: boolean) {
		globalUIState.sidebarOpen = isOpen;
	},

	// Modal management
	openModal(modalId: string) {
		if (!globalUIState.modalStack.includes(modalId)) {
			globalUIState.modalStack = [...globalUIState.modalStack, modalId];
		}
	},

	closeModal(modalId?: string) {
		if (modalId) {
			globalUIState.modalStack = globalUIState.modalStack.filter(id => id !== modalId);
		} else {
			// Close the top modal
			globalUIState.modalStack = globalUIState.modalStack.slice(0, -1);
		}
	},

	closeAllModals() {
		globalUIState.modalStack = [];
	},

	// Notification management
	addNotification(type: 'info' | 'success' | 'warning' | 'error', message: string) {
		const notification = {
			id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			type,
			message,
			timestamp: Date.now()
		};
		
		globalUIState.notifications = [...globalUIState.notifications, notification];
		
		// Auto-remove after 5 seconds for non-error notifications
		if (type !== 'error') {
			setTimeout(() => {
				globalUIActions.removeNotification(notification.id);
			}, 5000);
		}
		
		return notification.id;
	},

	removeNotification(id: string) {
		globalUIState.notifications = globalUIState.notifications.filter(n => n.id !== id);
	},

	clearAllNotifications() {
		globalUIState.notifications = [];
	}
};

/**
 * Getter functions for reactive access
 */
export function getGlobalUIState() {
	return globalUIState;
}

export function isFullScreen() {
	return globalUIState.isFullScreen;
}

export function getCurrentTheme() {
	return globalUIState.theme;
}

export function isSidebarOpen() {
	return globalUIState.sidebarOpen;
}

export function getModalStack() {
	return globalUIState.modalStack;
}

export function getCurrentModal() {
	return currentModal;
}

export function getNotifications() {
	return globalUIState.notifications;
}

export function hasActiveModals() {
	return hasModals;
}

export function hasActiveNotifications() {
	return hasNotifications;
}

// Backward compatibility - export as uiStore
export const uiStore = {
	toggleFullScreen: globalUIActions.toggleFullScreen,
	setFullScreen: globalUIActions.setFullScreen,
	toggleSidebar: globalUIActions.toggleSidebar,
	setSidebarOpen: globalUIActions.setSidebarOpen,
	openModal: globalUIActions.openModal,
	closeModal: globalUIActions.closeModal,
	addNotification: globalUIActions.addNotification,
	removeNotification: globalUIActions.removeNotification,
	
	// Getters for reactive access
	get isFullScreen() { return globalUIState.isFullScreen; },
	get theme() { return globalUIState.theme; },
	get sidebarOpen() { return globalUIState.sidebarOpen; },
	get modalStack() { return globalUIState.modalStack; },
	get notifications() { return globalUIState.notifications; }
};
