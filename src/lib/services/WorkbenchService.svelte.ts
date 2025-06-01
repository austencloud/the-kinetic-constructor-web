/**
 * Modern Workbench Service Implementation
 * Manages layout, panels, and responsive behavior
 */

import type {
	IWorkbenchService,
	WorkbenchState,
	WorkbenchLayout,
	WorkbenchServiceConfig,
	WorkbenchServiceEvents,
	PanelType,
	ViewMode,
	LayoutMode
} from './core/IWorkbenchService';
import { defaultWorkbenchConfig, defaultWorkbenchLayout } from './core/IWorkbenchService';
import { browser } from '$app/environment';

export class WorkbenchService implements IWorkbenchService {
	private config: WorkbenchServiceConfig;
	private eventListeners = new Map<keyof WorkbenchServiceEvents, Set<Function>>();

	// Core reactive state
	private _state = $state<WorkbenchState>({
		activePanel: 'generate',
		toolsPanelOpen: false,
		fullscreenMode: false,
		viewMode: 'normal',
		layout: { ...defaultWorkbenchLayout },
		isLoading: false,
		error: null
	});

	constructor(config: Partial<WorkbenchServiceConfig> = {}) {
		console.log('🔧 WorkbenchService constructor called with config:', config);

		this.config = { ...defaultWorkbenchConfig, ...config };
		this._state.activePanel = this.config.defaultPanel;

		// Load saved preferences
		if (this.config.persistLayout) {
			this.loadLayoutPreferences();
		}

		// Set up responsive layout monitoring
		this.setupResponsiveMonitoring();

		console.log('✅ WorkbenchService initialized successfully');
	}

	get state(): WorkbenchState {
		return this._state;
	}

	// Derived computations
	readonly isMobile = $derived(this._state.layout.layoutMode === 'mobile');
	readonly isTablet = $derived(this._state.layout.layoutMode === 'tablet');
	readonly isDesktop = $derived(this._state.layout.layoutMode === 'desktop');

	readonly canShowToolsPanel = $derived(
		this._state.layout.containerWidth > 768 && !this._state.fullscreenMode
	);

	readonly optimalCellSize = $derived(() => {
		const { containerWidth, containerHeight, beatGridColumns, beatGridRows } = this._state.layout;
		const availableWidth = containerWidth * 0.8; // Leave some margin
		const availableHeight = containerHeight * 0.7;

		const cellSizeByWidth = availableWidth / beatGridColumns;
		const cellSizeByHeight = availableHeight / beatGridRows;

		const optimalSize = Math.min(cellSizeByWidth, cellSizeByHeight);

		return Math.max(this.config.minCellSize, Math.min(this.config.maxCellSize, optimalSize));
	});

	// Panel management
	setActivePanel(panel: PanelType): void {
		if (this._state.activePanel !== panel) {
			this._state.activePanel = panel;
			this.emit('panel:changed', { panel });
		}
	}

	toggleToolsPanel(): void {
		if (this.canShowToolsPanel) {
			this._state.toolsPanelOpen = !this._state.toolsPanelOpen;
			this.emit('tools-panel:toggled', { open: this._state.toolsPanelOpen });
		}
	}

	openToolsPanel(): void {
		if (this.canShowToolsPanel) {
			this._state.toolsPanelOpen = true;
			this.emit('tools-panel:toggled', { open: true });
		}
	}

	closeToolsPanel(): void {
		this._state.toolsPanelOpen = false;
		this.emit('tools-panel:toggled', { open: false });
	}

	// Layout management
	updateLayout(layout: Partial<WorkbenchLayout>): void {
		this._state.layout = { ...this._state.layout, ...layout };
		this.emit('layout:updated', { layout: this._state.layout });

		if (this.config.persistLayout) {
			this.saveLayoutPreferences();
		}
	}

	setViewMode(mode: ViewMode): void {
		this._state.viewMode = mode;

		// Adjust layout based on view mode
		if (mode === 'fullscreen') {
			this.enterFullscreen();
		} else if (mode === 'normal' && this._state.fullscreenMode) {
			this.exitFullscreen();
		}
	}

	toggleFullscreen(): void {
		if (this.config.enableFullscreen) {
			if (this._state.fullscreenMode) {
				this.exitFullscreen();
			} else {
				this.enterFullscreen();
			}
		}
	}

	enterFullscreen(): void {
		if (this.config.enableFullscreen) {
			this._state.fullscreenMode = true;
			this._state.toolsPanelOpen = false; // Close tools panel in fullscreen
			this.emit('fullscreen:toggled', { fullscreen: true });
		}
	}

	exitFullscreen(): void {
		this._state.fullscreenMode = false;
		this.emit('fullscreen:toggled', { fullscreen: false });
	}

	// Responsive layout
	handleResize(width: number, height: number): void {
		const newLayout = this.calculateOptimalLayout(width, height, 0); // beatCount will be injected
		this.updateLayout(newLayout);
	}

	calculateOptimalLayout(width: number, height: number, beatCount: number): WorkbenchLayout {
		// Determine layout mode based on width
		let layoutMode: LayoutMode = 'desktop';
		if (width < 768) {
			layoutMode = 'mobile';
		} else if (width < 1024) {
			layoutMode = 'tablet';
		}

		// Calculate optimal grid dimensions
		let beatGridColumns = this.config.defaultColumns;
		let beatGridRows = 1;

		if (beatCount > 0) {
			// Adjust columns based on layout mode
			if (layoutMode === 'mobile') {
				beatGridColumns = Math.min(2, beatCount);
			} else if (layoutMode === 'tablet') {
				beatGridColumns = Math.min(3, beatCount);
			} else {
				beatGridColumns = Math.min(4, beatCount);
			}

			beatGridRows = Math.ceil(beatCount / beatGridColumns);
		}

		// Calculate optimal cell size
		const availableWidth = width * (layoutMode === 'mobile' ? 0.9 : 0.8);
		const availableHeight = height * 0.7;

		const cellSizeByWidth = availableWidth / beatGridColumns;
		const cellSizeByHeight = availableHeight / beatGridRows;

		const cellSize = Math.max(
			this.config.minCellSize,
			Math.min(this.config.maxCellSize, Math.min(cellSizeByWidth, cellSizeByHeight))
		);

		return {
			containerWidth: width,
			containerHeight: height,
			beatGridColumns,
			beatGridRows,
			cellSize,
			isPortrait: height > width,
			layoutMode
		};
	}

	// State management
	setLoading(loading: boolean): void {
		this._state.isLoading = loading;
	}

	setError(error: string | null): void {
		this._state.error = error;
		if (error) {
			this.emit('error:occurred', { error });
		}
	}

	clearError(): void {
		this._state.error = null;
		this.emit('error:cleared', {});
	}

	// Persistence
	saveLayoutPreferences(): void {
		if (!browser) return;

		try {
			const preferences = {
				activePanel: this._state.activePanel,
				viewMode: this._state.viewMode,
				layout: this._state.layout
			};

			localStorage.setItem(this.config.persistenceKey, JSON.stringify(preferences));
		} catch (error) {
			console.error('Failed to save layout preferences:', error);
		}
	}

	loadLayoutPreferences(): void {
		if (!browser) return;

		try {
			const saved = localStorage.getItem(this.config.persistenceKey);
			if (saved) {
				const preferences = JSON.parse(saved);

				if (preferences.activePanel) {
					this._state.activePanel = preferences.activePanel;
				}

				if (preferences.viewMode) {
					this._state.viewMode = preferences.viewMode;
				}

				if (preferences.layout) {
					this._state.layout = { ...this._state.layout, ...preferences.layout };
				}
			}
		} catch (error) {
			console.error('Failed to load layout preferences:', error);
		}
	}

	// Event system
	on<K extends keyof WorkbenchServiceEvents>(
		event: K,
		listener: (data: WorkbenchServiceEvents[K]) => void
	): () => void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}

		this.eventListeners.get(event)!.add(listener);

		return () => this.eventListeners.get(event)?.delete(listener);
	}

	private emit<K extends keyof WorkbenchServiceEvents>(
		event: K,
		data: WorkbenchServiceEvents[K]
	): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => listener(data));
		}
	}

	// FIXED: Responsive monitoring setup without reactive loops
	private setupResponsiveMonitoring(): void {
		// Disable responsive monitoring to prevent reactive loops
		// Will be handled by individual components instead
		console.log('Responsive monitoring disabled to prevent reactive loops');
	}
}
