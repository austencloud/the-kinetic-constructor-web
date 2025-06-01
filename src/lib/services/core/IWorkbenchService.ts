/**
 * Workbench Service Interface
 * Manages workbench layout, panels, and UI state
 */

export type PanelType = 'generate' | 'construct' | 'editor' | 'settings';
export type LayoutMode = 'desktop' | 'tablet' | 'mobile';
export type ViewMode = 'normal' | 'fullscreen' | 'compact';

export interface WorkbenchLayout {
	containerWidth: number;
	containerHeight: number;
	beatGridColumns: number;
	beatGridRows: number;
	cellSize: number;
	isPortrait: boolean;
	layoutMode: LayoutMode;
}

export interface WorkbenchState {
	activePanel: PanelType;
	toolsPanelOpen: boolean;
	fullscreenMode: boolean;
	viewMode: ViewMode;
	layout: WorkbenchLayout;
	isLoading: boolean;
	error: string | null;
}

export interface IWorkbenchService {
	// Reactive state
	readonly state: WorkbenchState;

	// Derived computations
	readonly isMobile: boolean;
	readonly isTablet: boolean;
	readonly isDesktop: boolean;
	readonly canShowToolsPanel: boolean;
	readonly optimalCellSize: () => number;

	// Panel management
	setActivePanel(panel: PanelType): void;
	toggleToolsPanel(): void;
	openToolsPanel(): void;
	closeToolsPanel(): void;

	// Layout management
	updateLayout(layout: Partial<WorkbenchLayout>): void;
	setViewMode(mode: ViewMode): void;
	toggleFullscreen(): void;
	enterFullscreen(): void;
	exitFullscreen(): void;

	// Responsive layout
	handleResize(width: number, height: number): void;
	calculateOptimalLayout(width: number, height: number, beatCount: number): WorkbenchLayout;

	// State management
	setLoading(loading: boolean): void;
	setError(error: string | null): void;
	clearError(): void;

	// Persistence
	saveLayoutPreferences(): void;
	loadLayoutPreferences(): void;
}

export interface WorkbenchServiceEvents {
	'panel:changed': { panel: PanelType };
	'layout:updated': { layout: WorkbenchLayout };
	'fullscreen:toggled': { fullscreen: boolean };
	'tools-panel:toggled': { open: boolean };
	'error:occurred': { error: string };
	'error:cleared': {};
}

export interface WorkbenchServiceConfig {
	defaultPanel: PanelType;
	enableFullscreen: boolean;
	persistLayout: boolean;
	persistenceKey: string;
	minCellSize: number;
	maxCellSize: number;
	defaultColumns: number;
}

export const defaultWorkbenchConfig: WorkbenchServiceConfig = {
	defaultPanel: 'generate',
	enableFullscreen: true,
	persistLayout: true,
	persistenceKey: 'workbench_layout',
	minCellSize: 60,
	maxCellSize: 200,
	defaultColumns: 4
};

export const defaultWorkbenchLayout: WorkbenchLayout = {
	containerWidth: 1024,
	containerHeight: 768,
	beatGridColumns: 4,
	beatGridRows: 3,
	cellSize: 120,
	isPortrait: false,
	layoutMode: 'desktop'
};
