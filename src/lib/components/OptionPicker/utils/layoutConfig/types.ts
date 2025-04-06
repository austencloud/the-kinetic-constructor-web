// src/lib/components/OptionPicker/utils/types.ts

/**
 * Supported device types for responsive layouts
 */
export type DeviceType = 'smallMobile' | 'mobile' | 'tablet' | 'desktop' | 'largeDesktop';

/**
 * Layout categories based on item count
 */
export type LayoutCategory = 'singleItem' | 'twoItems' | 'fewItems' | 'mediumItems' | 'manyItems';

/**
 * Container aspect ratio classification
 */
export type ContainerAspect = 'tall' | 'square' | 'wide';

/**
 * Sort methods for organizing options
 */
export type SortMethod = 'type' | 'endPosition' | 'reversals';

/**
 * Filter options for reversals
 */
export type ReversalFilter = 'all' | 'continuous' | 'oneReversal' | 'twoReversals';

/**
 * Grid configuration returned by calculation functions
 */
export interface GridConfiguration {
	columns: number;
	rows: number;
	template: string;
}

/**
 * Complete layout configuration for the OptionPicker
 */
export interface ResponsiveLayoutConfig {
	gridColumns: string;
	optionSize: string;
	gridGap: string;
	gridClass: string;
	aspectClass: string;
	scaleFactor: number;
}

/**
 * State for the option picker store
 */
export interface OptionPickerState {
	allOptions: any[]; // Use your PictographData type here
	currentSequence: any[]; // Use your PictographData type here
	sortMethod: SortMethod;
	reversalFilter: ReversalFilter;
	showAllActive: boolean;
	isLoading: boolean;
	error: string | null;
}
