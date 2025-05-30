/**
 * WriteTab UI Store - Svelte 5 Runes Implementation
 */

interface WriteTabUIState {
	sidebarWidth: number;
	isResizing: boolean;
	selectedSection: number;
}

function createWriteTabUIStore() {
	let sidebarWidth = $state(300);
	let isResizing = $state(false);
	let selectedSection = $state(0);

	return {
		get sidebarWidth() { return sidebarWidth; },
		get isResizing() { return isResizing; },
		get selectedSection() { return selectedSection; },
		
		setSidebarWidth(width: number) {
			sidebarWidth = width;
		},
		
		setResizing(resizing: boolean) {
			isResizing = resizing;
		},
		
		setSelectedSection(section: number) {
			selectedSection = section;
		},
		
		reset() {
			sidebarWidth = 300;
			isResizing = false;
			selectedSection = 0;
		}
	};
}

export const uiStore = createWriteTabUIStore();
