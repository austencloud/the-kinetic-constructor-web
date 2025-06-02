/**
 * Layout Service Implementation - Modern OptionPicker Nuclear Rebuild
 * Uses Svelte 5 runes for reactive state management without manual subscriptions
 */

import type { 
  ILayoutService, 
  LayoutServiceState, 
  LayoutServiceEvents, 
  LayoutServiceConfig,
  GridLayout,
  LayoutConstraints,
  BreakpointType,
  GridMode
} from './core/ILayoutService';

const defaultConstraints: LayoutConstraints = {
  minCellSize: 80,
  maxCellSize: 200,
  minColumns: 2,
  maxColumns: 8,
  preferredAspectRatio: 1.0,
  containerPadding: 16
};

const defaultBreakpoints: Record<BreakpointType, number> = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1536
};

const defaultConfig: LayoutServiceConfig = {
  enableResponsive: true,
  enablePerformanceOptimization: true,
  calculationThrottle: 16, // 60fps
  defaultBreakpoints,
  defaultConstraints
};

/**
 * Modern Layout Service using Svelte 5 runes
 * Provides reactive state management without manual subscriptions
 */
export class LayoutService implements ILayoutService {
  private config: LayoutServiceConfig;
  private eventListeners = new Map<keyof LayoutServiceEvents, Set<Function>>();
  private calculationTimeout: number | null = null;

  // Core reactive state using $state
  private _state = $state<LayoutServiceState>({
    containerWidth: 0,
    containerHeight: 0,
    currentLayout: this.createDefaultLayout(),
    gridMode: 'responsive',
    breakpoint: 'md',
    constraints: defaultConstraints,
    isCalculating: false,
    lastCalculationTime: 0,
    itemCount: 0,
    lastUpdateTime: null
  });

  constructor(config: Partial<LayoutServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this._state.constraints = { ...defaultConstraints, ...config.defaultConstraints };
  }

  // Reactive state (read-only)
  get state(): LayoutServiceState {
    return this._state;
  }

  // Derived computations using $derived
  get optimalGridLayout(): GridLayout {
    return this._state.currentLayout;
  }

  get responsiveBreakpoint(): BreakpointType {
    return this._state.breakpoint;
  }

  get cellSize(): number {
    return this._state.currentLayout.cellSize;
  }

  get gridColumns(): number {
    return this._state.currentLayout.columns;
  }

  get gridRows(): number {
    return this._state.currentLayout.rows;
  }

  get totalGridArea(): number {
    return this._state.currentLayout.totalWidth * this._state.currentLayout.totalHeight;
  }

  get isResponsive(): boolean {
    return this._state.gridMode === 'responsive' || this._state.gridMode === 'auto';
  }

  // Core actions
  updateContainerSize(width: number, height: number): void {
    if (this._state.containerWidth === width && this._state.containerHeight === height) {
      return; // No change
    }

    this._state.containerWidth = width;
    this._state.containerHeight = height;
    this._state.breakpoint = this.getBreakpointForWidth(width);

    this.throttledCalculateLayout();
    this.emit('container:resized', { width, height });
  }

  setGridMode(mode: GridMode): void {
    if (this._state.gridMode === mode) return;

    this._state.gridMode = mode;
    this.throttledCalculateLayout();
    this.emit('mode:changed', { mode });
  }

  setItemCount(count: number): void {
    if (this._state.itemCount === count) return;

    this._state.itemCount = count;
    this.throttledCalculateLayout();
  }

  // Layout calculations
  calculateOptimalLayout(itemCount: number): GridLayout {
    const { containerWidth, containerHeight, constraints, gridMode } = this._state;

    if (gridMode === 'responsive' || gridMode === 'auto') {
      return this.calculateResponsiveLayout(containerWidth, containerHeight, itemCount);
    } else {
      // Fixed mode - calculate based on current layout
      return this.calculateFixedLayout(this._state.currentLayout.columns, this._state.currentLayout.rows);
    }
  }

  calculateResponsiveLayout(containerWidth: number, containerHeight: number, itemCount: number): GridLayout {
    if (itemCount === 0) {
      return this.createDefaultLayout();
    }

    const { constraints } = this._state;
    const availableWidth = containerWidth - (constraints.containerPadding * 2);
    const availableHeight = containerHeight - (constraints.containerPadding * 2);

    // Calculate optimal columns based on container width and constraints
    const maxColumnsFromWidth = Math.floor(availableWidth / constraints.minCellSize);
    const optimalColumns = Math.min(
      Math.max(constraints.minColumns, maxColumnsFromWidth),
      Math.min(constraints.maxColumns, itemCount)
    );

    // Calculate rows needed
    const rows = Math.ceil(itemCount / optimalColumns);

    // Calculate cell size based on available space
    const cellWidthFromColumns = (availableWidth - ((optimalColumns - 1) * 8)) / optimalColumns; // 8px gap
    const cellHeightFromRows = rows > 0 ? (availableHeight - ((rows - 1) * 8)) / rows : cellWidthFromColumns;

    // Use the smaller dimension to maintain aspect ratio
    const cellSize = Math.min(
      Math.max(constraints.minCellSize, Math.min(cellWidthFromColumns, cellHeightFromRows)),
      constraints.maxCellSize
    );

    const gap = 8;
    const totalWidth = (optimalColumns * cellSize) + ((optimalColumns - 1) * gap);
    const totalHeight = (rows * cellSize) + ((rows - 1) * gap);

    return {
      columns: optimalColumns,
      rows,
      cellSize,
      gap,
      totalWidth,
      totalHeight,
      aspectRatio: totalWidth / totalHeight
    };
  }

  calculateFixedLayout(columns: number, rows: number): GridLayout {
    const { containerWidth, containerHeight, constraints } = this._state;
    const availableWidth = containerWidth - (constraints.containerPadding * 2);
    const availableHeight = containerHeight - (constraints.containerPadding * 2);

    const gap = 8;
    const cellWidth = (availableWidth - ((columns - 1) * gap)) / columns;
    const cellHeight = (availableHeight - ((rows - 1) * gap)) / rows;
    const cellSize = Math.min(cellWidth, cellHeight);

    const totalWidth = (columns * cellSize) + ((columns - 1) * gap);
    const totalHeight = (rows * cellSize) + ((rows - 1) * gap);

    return {
      columns,
      rows,
      cellSize: Math.max(constraints.minCellSize, Math.min(cellSize, constraints.maxCellSize)),
      gap,
      totalWidth,
      totalHeight,
      aspectRatio: totalWidth / totalHeight
    };
  }

  // Constraints management
  setConstraints(constraints: Partial<LayoutConstraints>): void {
    this._state.constraints = { ...this._state.constraints, ...constraints };
    this.throttledCalculateLayout();
    this.emit('constraints:updated', { constraints: this._state.constraints });
  }

  setMinCellSize(size: number): void {
    this.setConstraints({ minCellSize: size });
  }

  setMaxCellSize(size: number): void {
    this.setConstraints({ maxCellSize: size });
  }

  setPreferredAspectRatio(ratio: number): void {
    this.setConstraints({ preferredAspectRatio: ratio });
  }

  // Breakpoint management
  getBreakpointForWidth(width: number): BreakpointType {
    const breakpoints = this.config.defaultBreakpoints;
    
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }

  getColumnsForBreakpoint(breakpoint: BreakpointType): number {
    const columnMap: Record<BreakpointType, number> = {
      xs: 2,
      sm: 3,
      md: 4,
      lg: 5,
      xl: 6
    };
    return columnMap[breakpoint];
  }

  // Utility methods
  isLayoutValid(layout: GridLayout): boolean {
    const { constraints } = this._state;
    return (
      layout.cellSize >= constraints.minCellSize &&
      layout.cellSize <= constraints.maxCellSize &&
      layout.columns >= constraints.minColumns &&
      layout.columns <= constraints.maxColumns &&
      layout.rows > 0
    );
  }

  getLayoutEfficiency(layout: GridLayout, itemCount: number): number {
    if (itemCount === 0) return 1;
    
    const totalCells = layout.columns * layout.rows;
    const usedCells = Math.min(itemCount, totalCells);
    return usedCells / totalCells;
  }

  optimizeForPerformance(layout: GridLayout): GridLayout {
    if (!this.config.enablePerformanceOptimization) return layout;

    // Optimize by reducing precision for better performance
    return {
      ...layout,
      cellSize: Math.round(layout.cellSize),
      totalWidth: Math.round(layout.totalWidth),
      totalHeight: Math.round(layout.totalHeight)
    };
  }

  // Private helper methods
  private createDefaultLayout(): GridLayout {
    return {
      columns: 4,
      rows: 1,
      cellSize: 120,
      gap: 8,
      totalWidth: 512,
      totalHeight: 120,
      aspectRatio: 512 / 120
    };
  }

  private throttledCalculateLayout(): void {
    if (this.calculationTimeout) {
      clearTimeout(this.calculationTimeout);
    }

    this.calculationTimeout = window.setTimeout(() => {
      this.performLayoutCalculation();
    }, this.config.calculationThrottle);
  }

  private performLayoutCalculation(): void {
    const startTime = performance.now();
    this._state.isCalculating = true;

    try {
      const newLayout = this.calculateOptimalLayout(this._state.itemCount);
      const optimizedLayout = this.optimizeForPerformance(newLayout);

      if (this.isLayoutValid(optimizedLayout)) {
        this._state.currentLayout = optimizedLayout;
        this._state.lastUpdateTime = new Date();
        
        const duration = performance.now() - startTime;
        this._state.lastCalculationTime = duration;
        
        this.emit('layout:changed', { layout: optimizedLayout });
        this.emit('calculation:completed', { layout: optimizedLayout, duration });
      }
    } catch (error) {
      console.error('LayoutService: Error calculating layout:', error);
    } finally {
      this._state.isCalculating = false;
    }
  }

  // Event system
  on<K extends keyof LayoutServiceEvents>(
    event: K,
    listener: (data: LayoutServiceEvents[K]) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener);

    return () => this.eventListeners.get(event)?.delete(listener);
  }

  private emit<K extends keyof LayoutServiceEvents>(
    event: K,
    data: LayoutServiceEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }
}
