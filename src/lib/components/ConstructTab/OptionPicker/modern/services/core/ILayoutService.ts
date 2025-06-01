/**
 * Layout Service Interface - Modern OptionPicker Nuclear Rebuild
 * Provides reactive state management for responsive layout calculations
 */

export type BreakpointType = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type GridMode = 'auto' | 'fixed' | 'responsive';

export interface GridLayout {
  columns: number;
  rows: number;
  cellSize: number;
  gap: number;
  totalWidth: number;
  totalHeight: number;
  aspectRatio: number;
}

export interface LayoutConstraints {
  minCellSize: number;
  maxCellSize: number;
  minColumns: number;
  maxColumns: number;
  preferredAspectRatio: number;
  containerPadding: number;
}

export interface LayoutServiceState {
  // Container dimensions
  containerWidth: number;
  containerHeight: number;
  
  // Grid configuration
  currentLayout: GridLayout;
  gridMode: GridMode;
  breakpoint: BreakpointType;
  
  // Constraints
  constraints: LayoutConstraints;
  
  // Performance
  isCalculating: boolean;
  lastCalculationTime: number;
  
  // Metadata
  itemCount: number;
  lastUpdateTime: Date | null;
}

/**
 * Core interface for layout management service
 * Provides reactive state management with Svelte 5 runes
 */
export interface ILayoutService {
  // Reactive state (read-only)
  readonly state: LayoutServiceState;
  
  // Derived computations
  readonly optimalGridLayout: GridLayout;
  readonly responsiveBreakpoint: BreakpointType;
  readonly cellSize: number;
  readonly gridColumns: number;
  readonly gridRows: number;
  readonly totalGridArea: number;
  readonly isResponsive: boolean;
  
  // Core actions
  updateContainerSize(width: number, height: number): void;
  setGridMode(mode: GridMode): void;
  setItemCount(count: number): void;
  
  // Layout calculations
  calculateOptimalLayout(itemCount: number): GridLayout;
  calculateResponsiveLayout(containerWidth: number, containerHeight: number, itemCount: number): GridLayout;
  calculateFixedLayout(columns: number, rows: number): GridLayout;
  
  // Constraints management
  setConstraints(constraints: Partial<LayoutConstraints>): void;
  setMinCellSize(size: number): void;
  setMaxCellSize(size: number): void;
  setPreferredAspectRatio(ratio: number): void;
  
  // Breakpoint management
  getBreakpointForWidth(width: number): BreakpointType;
  getColumnsForBreakpoint(breakpoint: BreakpointType): number;
  
  // Utility methods
  isLayoutValid(layout: GridLayout): boolean;
  getLayoutEfficiency(layout: GridLayout, itemCount: number): number;
  optimizeForPerformance(layout: GridLayout): GridLayout;
  
  // Event system
  on(event: 'layout:changed', handler: (data: { layout: GridLayout }) => void): () => void;
  on(event: 'breakpoint:changed', handler: (data: { breakpoint: BreakpointType }) => void): () => void;
  on(event: 'container:resized', handler: (data: { width: number; height: number }) => void): () => void;
  on(event: 'calculation:completed', handler: (data: { layout: GridLayout; duration: number }) => void): () => void;
}

/**
 * Events that the layout service can emit
 */
export interface LayoutServiceEvents {
  'layout:changed': { layout: GridLayout };
  'breakpoint:changed': { breakpoint: BreakpointType };
  'container:resized': { width: number; height: number };
  'calculation:completed': { layout: GridLayout; duration: number };
  'constraints:updated': { constraints: LayoutConstraints };
  'mode:changed': { mode: GridMode };
}

/**
 * Configuration options for layout service
 */
export interface LayoutServiceConfig {
  enableResponsive: boolean;
  enablePerformanceOptimization: boolean;
  calculationThrottle: number;
  defaultBreakpoints: Record<BreakpointType, number>;
  defaultConstraints: LayoutConstraints;
}
