// src/lib/components/OptionPicker/utils/layoutUtils.ts
import { writable } from 'svelte/store';
import { memoizeLRU } from '$lib/utils/memoizationUtils';
import {
	DEVICE_CONFIG,
	LAYOUT_TEMPLATES,
	GAP_ADJUSTMENTS,
	getContainerAspect,
	getDeviceType,
	getLayoutCategory
} from '../config';
import { DEFAULT_COLUMNS, LAYOUT_RULES, GRID_GAP_OVERRIDES } from './layoutConfig';

import type {
	DeviceType,
	LayoutCategory,
	ContainerAspect,
	ResponsiveLayoutConfig
} from '../config';

// Store to track which layout rule is currently active
export const activeLayoutRule = writable<any>(null);

/**
 * Main function to get responsive layout configuration
 */
export const getResponsiveLayout = memoizeLRU(
	(
		count: number,
		containerHeight: number = 0,
		containerWidth: number = 0,
		isMobileDevice: boolean = false,
		isPortraitMode: boolean = false
	): ResponsiveLayoutConfig => {
		// Fallback for invalid dimensions
		if (containerHeight <= 0 || containerWidth <= 0) {
			console.warn('getResponsiveLayout called with invalid dimensions.');
			return {
				gridColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
				optionSize: isMobileDevice ? '80px' : '100px',
				gridGap: '8px',
				gridClass: '',
				aspectClass: '',
				scaleFactor: isMobileDevice ? 0.95 : 1.0
			};
		}

		// Calculate grid configuration
		const gridConfig = calculateGridConfiguration({
			count,
			containerWidth,
			containerHeight,
			isMobileDevice,
			isPortraitMode
		});

		// Calculate item size
		const optionSize = calculateItemSize({
			count,
			containerWidth,
			containerHeight,
			gridConfig,
			isMobileDevice,
			isPortraitMode
		});

		// Get container aspect
		const containerAspect = getContainerAspect(containerWidth, containerHeight);

		// Get grid gap using our simplified config
		let gridGap = getGridGap({
			count,
			containerWidth,
			containerHeight,
			isMobileDevice,
			isPortraitMode
		});

		// Get grid classes
		const { gridClass, aspectClass } = getGridClasses(
			count,
			containerWidth,
			containerHeight,
			isPortraitMode
		);

		// Get scale factor for the pictograph itself
		const deviceType = getDeviceType(containerWidth, isMobileDevice);
		const deviceConfig = DEVICE_CONFIG[deviceType];
		const scaleFactor = deviceConfig.scaleFactor;

		// Return the complete layout configuration
		return {
			gridColumns: gridConfig.template,
			optionSize,
			gridGap,
			gridClass,
			aspectClass,
			scaleFactor
		};
	},
	100,
	// Round dimensions to reduce cache misses
	(count, containerHeight = 0, containerWidth = 0, isMobileDevice, isPortraitMode) => {
		const roundedWidth = Math.round(containerWidth / 10) * 10;
		const roundedHeight = Math.round(containerHeight / 10) * 10;
		return `${count}:${roundedHeight}:${roundedWidth}:${isMobileDevice}:${isPortraitMode}`;
	}
);

/**
 * Checks if a layout rule's conditions match the current state
 */
function doesRuleMatch(rule: any, params: any): boolean {
	// Check for exact count match
	if (rule.when.count !== undefined && rule.when.count !== params.count) {
		return false;
	}

	// Check for minimum count
	if (rule.when.minCount !== undefined && params.count < rule.when.minCount) {
		return false;
	}

	// Check for device type
	if (rule.when.device === 'desktop' && params.isMobileDevice) {
		return false;
	}
	if (rule.when.device === 'mobile' && !params.isMobileDevice) {
		return false;
	}

	// Check for aspect ratio
	if (rule.when.aspect && rule.when.aspect !== params.containerAspect) {
		return false;
	}

	// Check for multiple allowed aspects
	if (rule.when.aspects && !rule.when.aspects.includes(params.containerAspect)) {
		return false;
	}

	// Check for orientation
	if (rule.when.orientation === 'portrait' && !params.isPortraitMode) {
		return false;
	}
	if (rule.when.orientation === 'landscape' && params.isPortraitMode) {
		return false;
	}

	// Check for extra custom conditions
	if (
		rule.when.extraCheck &&
		!rule.when.extraCheck(params.containerWidth, params.containerHeight)
	) {
		return false;
	}

	// All conditions passed!
	return true;
}

/**
 * Calculates the optimal grid configuration using our simplified config
 */
const calculateGridConfiguration = memoizeLRU(
	(params: {
		count: number;
		containerWidth: number;
		containerHeight: number;
		isMobileDevice: boolean;
		isPortraitMode: boolean;
	}) => {
		const layoutCategory = getLayoutCategory(params.count);
		const containerAspect = getContainerAspect(params.containerWidth, params.containerHeight);

		// Get initial base columns from defaults
		let columns = getBaseColumnCount(layoutCategory, containerAspect, params.isPortraitMode);

		// Enhanced params with derived values
		const fullParams = {
			...params,
			containerAspect,
			layoutCategory
		};

		// Reset active rule to null
		activeLayoutRule.set(null);

		// Find first matching layout rule
		for (const rule of LAYOUT_RULES) {
			if (doesRuleMatch(rule, fullParams)) {
				// Set the active rule in the store
				activeLayoutRule.set(rule);
				
				if (rule.columns === '+1') {
					// Special case: add 1 to the base columns (up to max)
					columns = Math.min(rule.maxColumns || 8, columns + 1);
				} else {
					columns = parseInt(rule.columns.toString(), 10);
				}
				console.log(`Applied layout rule: ${rule.description}`);
				break; // Stop after first match
			}
		}

		// Ensure minimum of 1 column
		columns = Math.max(1, columns);

		// Calculate rows and template
		const rows = Math.ceil(params.count / columns);
		const template = `repeat(${columns}, minmax(0, 1fr))`;

		return { columns, rows, template };
	},
	100,
	// Round dimensions to reduce cache misses
	(params) => {
		const { count, containerWidth, containerHeight, isMobileDevice, isPortraitMode } = params;
		const roundedWidth = Math.round(containerWidth / 10) * 10;
		const roundedHeight = Math.round(containerHeight / 10) * 10;
		return `${count}:${roundedHeight}:${roundedWidth}:${isMobileDevice}:${isPortraitMode}`;
	}
);

/**
 * Gets the base column count for a given layout category
 */
function getBaseColumnCount(
	layoutCategory: LayoutCategory,
	aspect: ContainerAspect,
	isPortrait: boolean
): number {
	if (layoutCategory === 'singleItem') {
		return DEFAULT_COLUMNS.singleItem;
	}

	if (layoutCategory === 'twoItems') {
		// Determine vertical vs horizontal layout
		const useVerticalLayout = aspect === 'tall' || (aspect === 'square' && isPortrait);
		return useVerticalLayout
			? DEFAULT_COLUMNS.twoItems.vertical
			: DEFAULT_COLUMNS.twoItems.horizontal;
	}

	// For grid layouts, just use the default column count
	return DEFAULT_COLUMNS[layoutCategory] || 4;
}

/**
 * Calculates the optimal size for pictograph items
 */
const calculateItemSize = memoizeLRU(
	(config: {
		count: number;
		containerWidth: number;
		containerHeight: number;
		gridConfig: { columns: number; rows: number; template: string };
		isMobileDevice: boolean;
		isPortraitMode: boolean;
	}): string => {
		const { count, containerWidth, containerHeight, gridConfig, isMobileDevice } = config;
		const { columns, rows } = gridConfig;

		// Basic validation
		if (containerWidth <= 0 || containerHeight <= 0 || columns <= 0 || rows <= 0) {
			console.warn('Invalid dimensions or grid config for item size calculation.');
			return isMobileDevice ? '80px' : '100px';
		}

		const deviceType = getDeviceType(containerWidth, isMobileDevice);
		const deviceConfig =
			DEVICE_CONFIG[deviceType as keyof typeof DEVICE_CONFIG] || DEVICE_CONFIG.desktop;

		// Calculate available space
		const horizontalPadding = deviceConfig.padding.horizontal * 2;
		const verticalPadding = deviceConfig.padding.vertical * 2;
		const gapSize = deviceConfig.gap;
		const totalHorizontalGap = Math.max(0, columns - 1) * gapSize;
		const totalVerticalGap = Math.max(0, rows - 1) * gapSize;
		const availableWidth = containerWidth - horizontalPadding - totalHorizontalGap;
		const availableHeight = containerHeight - verticalPadding - totalVerticalGap;

		// Calculate size per item
		const widthPerItem = availableWidth / columns;
		const heightPerItem = availableHeight / rows;

		// Use the smaller dimension to ensure square items fit
		let calculatedSize = Math.min(widthPerItem, heightPerItem);

		// Apply scaling factor
		calculatedSize *= deviceConfig.scaleFactor;

		// Clamp between min and max
		calculatedSize = Math.max(deviceConfig.minItemSize, calculatedSize);
		calculatedSize = Math.min(deviceConfig.maxItemSize, calculatedSize);

		return `${Math.floor(calculatedSize)}px`;
	},
	100,
	// Round dimensions to reduce cache misses
	(config) => {
		const { count, containerWidth, containerHeight, gridConfig, isMobileDevice } = config;
		const roundedWidth = Math.round(containerWidth / 10) * 10;
		const roundedHeight = Math.round(containerHeight / 10) * 10;
		return `${count}:${roundedHeight}:${roundedWidth}:${gridConfig.columns}:${gridConfig.rows}:${isMobileDevice}`;
	}
);

/**
 * Gets the appropriate grid gap size using our config
 */
function getGridGap(params: {
	count: number;
	containerWidth: number;
	containerHeight: number;
	isMobileDevice: boolean;
	isPortraitMode: boolean;
}): string {
	const layoutCategory = getLayoutCategory(params.count);
	const deviceType = getDeviceType(params.containerWidth, params.isMobileDevice);
	const containerAspect = getContainerAspect(params.containerWidth, params.containerHeight);

	// Check for overrides first
	for (const override of GRID_GAP_OVERRIDES) {
		const fullParams = {
			...params,
			containerAspect,
			layoutCategory
		};

		if (doesRuleMatch(override, fullParams)) {
			console.log(`Applied gap override: ${override.description}`);
			return override.gap;
		}
	}

	// Use default gap based on device and layout
	const deviceConfig =
		DEVICE_CONFIG[deviceType as keyof typeof DEVICE_CONFIG] || DEVICE_CONFIG.desktop;

	// Apply custom gap adjustment based on layout category
	const gapSize =
		deviceConfig.gap + (GAP_ADJUSTMENTS[layoutCategory as keyof typeof GAP_ADJUSTMENTS] || 0);

	return `${gapSize}px`;
}

/**
 * Gets appropriate CSS classes for the grid based on layout
 */
function getGridClasses(
	count: number,
	containerWidth: number,
	containerHeight: number,
	isPortraitMode: boolean
): { gridClass: string; aspectClass: string } {
	const layoutCategory = getLayoutCategory(count);
	const containerAspect = getContainerAspect(containerWidth, containerHeight);

	let gridClass = '';

	// Determine base class from layout templates
	if (layoutCategory === 'singleItem') {
		gridClass = LAYOUT_TEMPLATES.singleItem.class;
	} else if (layoutCategory === 'twoItems') {
		const useVerticalLayout =
			containerAspect === 'tall' || (containerAspect === 'square' && isPortraitMode);
		gridClass = useVerticalLayout
			? LAYOUT_TEMPLATES.twoItems.vertical.class
			: LAYOUT_TEMPLATES.twoItems.horizontal.class;
	} else {
		// Grid layouts (3+ items)
		const deviceOrientation = isPortraitMode ? 'portraitDevice' : 'landscapeDevice';
		gridClass = LAYOUT_TEMPLATES[layoutCategory][deviceOrientation].class;
	}

	// Add aspect-based class
	const aspectClass = `${containerAspect}-aspect-container`;

	return { gridClass, aspectClass };
}