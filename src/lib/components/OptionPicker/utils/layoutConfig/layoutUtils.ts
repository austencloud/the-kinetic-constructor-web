// src/lib/components/OptionPicker/utils/layoutUtils.ts
import { memoizeLRU } from '$lib/utils/memoizationUtils';
import { BREAKPOINTS } from './breakpoints';
import { DEVICE_CONFIG } from './deviceConfigs';
import { GAP_ADJUSTMENTS } from './gapAdjustments';
import { LAYOUT_TEMPLATES } from './layoutTemplates';

export interface GridConfiguration {
	columns: number;
	rows: number;
	template: string;
}

export interface ResponsiveLayoutConfig {
	gridColumns: string;
	optionSize: string;
	gridGap: string;
	gridClass: string;
	aspectClass: string;
	scaleFactor: number;
}

/**
 * Determines container aspect ratio (wide, square, or tall)
 */
function getContainerAspect(width: number, height: number): 'wide' | 'square' | 'tall' {
	if (!width || !height) return 'square';
	const ratio = width / height;
	if (ratio < 0.8) return 'tall'; // Height significantly greater than width
	if (ratio > 1.3) return 'wide'; // Width significantly greater than height
	return 'square'; // Roughly square container
}

/**
 * Determines the device type based on container width and height
 */
function getDeviceType(width: number, isMobileDevice: boolean) {
	if (isMobileDevice) {
		return width < BREAKPOINTS.smallMobile ? 'smallMobile' : 'mobile';
	}
	if (width < BREAKPOINTS.tablet) return 'mobile'; // Treat narrow desktop as mobile for layout? Revisit if needed.
	if (width < BREAKPOINTS.laptop) return 'tablet';
	return 'desktop'; // Includes largeDesktop for config lookup
}

/**
 * Gets the layout category based on item count
 */
function getLayoutCategory(
	count: number
): 'singleItem' | 'twoItems' | 'fewItems' | 'mediumItems' | 'manyItems' {
	if (count === 1) return 'singleItem';
	if (count === 2) return 'twoItems';
	if (count <= 6) return 'fewItems';
	if (count <= 12) return 'mediumItems';
	return 'manyItems';
}

/**
 * Calculates the optimal grid configuration
 */
const calculateGridConfiguration = memoizeLRU(
	(
		count: number,
		containerWidth: number,
		containerHeight: number,
		isMobileDevice: boolean,
		isPortraitMode: boolean
	): GridConfiguration => {
		const layoutCategory = getLayoutCategory(count);
		const containerAspect = getContainerAspect(containerWidth, containerHeight);
		let columns = 0;

		// Handle special cases first
		if (layoutCategory === 'singleItem') {
			columns = 1;
		} else if (layoutCategory === 'twoItems') {
			// Determine layout based on container aspect and orientation
			const useVerticalLayout =
				containerAspect === 'tall' || (containerAspect === 'square' && isPortraitMode);
			columns = useVerticalLayout
				? LAYOUT_TEMPLATES.twoItems.vertical.cols
				: LAYOUT_TEMPLATES.twoItems.horizontal.cols;
		} else {
			// Grid layouts (3+ items)
			const deviceOrientation = isPortraitMode ? 'portraitDevice' : 'landscapeDevice';
			columns = LAYOUT_TEMPLATES[layoutCategory][deviceOrientation].cols;

			// --- Adjustments based on context ---

			if (count === 8) {
				if (containerAspect === 'tall') {
					columns = 2; // Tall containers get fewer columns
				}
			}
			// Special override for 16 items (often needs 4 columns)
			if (count === 16 && !isMobileDevice) {
				columns = 4;
				// Exception: If container is very tall, maybe use fewer columns?
				if (containerAspect === 'tall' && containerHeight > containerWidth * 1.8) {
					columns = 2; //
				}
				if (containerAspect === 'wide' && containerHeight < containerWidth * 0.5) {
					columns = 8; // Wide and short, use more columns
				}
			}

			// Adjust for small mobile screens
			if (isMobileDevice && containerWidth < BREAKPOINTS.smallMobile) {
				columns = Math.min(columns, 2); // Max 2 columns on very small screens
			}

			// Adjust for very large item counts on desktop/tablet
			if (!isMobileDevice && count > 16) {
				// Increase columns slightly for many items, respecting orientation
				columns = isPortraitMode ? Math.min(4, columns + 1) : Math.min(6, columns + 1);
			}

			// Adjust for very wide containers on desktop
			if (!isMobileDevice && !isPortraitMode && containerWidth > BREAKPOINTS.largeDesktop) {
				columns = Math.min(8, columns + 1); // Allow up to 8 columns on very wide screens
			}

			// Ensure minimum of 1 column
			columns = Math.max(1, columns);
		}

		// Calculate rows based on final column count
		const rows = Math.ceil(count / columns);
		const template = `repeat(${columns}, minmax(0, 1fr))`;

		return { columns, rows, template };
	},
	100, // Cache size
	(count, width, height, isMobile, isPortrait) =>
		`${count}:${Math.round(width)}:${Math.round(height)}:${isMobile}:${isPortrait}` // Cache key
);

/**
 * Calculates the optimal size for pictograph items
 */
const calculateItemSize = memoizeLRU(
	(config: {
		count: number;
		containerWidth: number;
		containerHeight: number;
		gridConfig: GridConfiguration;
		isMobileDevice: boolean;
		isPortraitMode: boolean; // Keep isPortraitMode if needed for logic
	}): string => {
		const { count, containerWidth, containerHeight, gridConfig, isMobileDevice } = config;
		const { columns, rows } = gridConfig;

		// Basic validation
		if (containerWidth <= 0 || containerHeight <= 0 || columns <= 0 || rows <= 0) {
			console.warn('Invalid dimensions or grid config for item size calculation.');
			return isMobileDevice ? '80px' : '100px'; // Fallback size
		}

		const layoutCategory = getLayoutCategory(count);
		const deviceTypeName = getDeviceType(containerWidth, isMobileDevice);
		// Ensure device type exists in config, fallback if necessary
		const deviceConfig =
			DEVICE_CONFIG[deviceTypeName as keyof typeof DEVICE_CONFIG] || DEVICE_CONFIG.desktop;

		// Calculate available space, accounting for padding
		const horizontalPadding = deviceConfig.padding.horizontal * 2;
		const verticalPadding = deviceConfig.padding.vertical * 2;

		// Calculate gap size, applying adjustments based on item count category
		const gapSize = deviceConfig.gap

		// Calculate total gap space
		const totalHorizontalGap = Math.max(0, columns - 1) * gapSize;
		const totalVerticalGap = Math.max(0, rows - 1) * gapSize;

		// Calculate available dimensions for items
		const availableWidth = containerWidth - horizontalPadding - totalHorizontalGap;
		const availableHeight = containerHeight - verticalPadding - totalVerticalGap;

		// Calculate the size per item based on available space and grid dimensions
		const widthPerItem = availableWidth / columns;
		const heightPerItem = availableHeight / rows;

		let calculatedSize: number;

		// --- ** THE FIX IS HERE ** ---
		// Use the SMALLER dimension to ensure square items fit without overflow.
		calculatedSize = Math.min(widthPerItem, heightPerItem);
		// --- ** END FIX ** ---

		// Apply device-specific scaling factor (e.g., make mobile items slightly smaller relative to their cell)
		calculatedSize *= deviceConfig.scaleFactor;

		// Clamp the size between min and max limits defined in device config
		calculatedSize = Math.max(deviceConfig.minItemSize, calculatedSize);
		calculatedSize = Math.min(deviceConfig.maxItemSize, calculatedSize);

		// Return size in pixels
		return `${Math.floor(calculatedSize)}px`;
	},
	100, // Cache size
	(config) =>
		// Cache key using relevant parameters
		`${config.count}:${Math.round(config.containerWidth)}:${Math.round(config.containerHeight)}:${config.gridConfig.columns}:${config.gridConfig.rows}:${config.isMobileDevice}`
);

/**
 * Gets the appropriate grid gap size
 */
function getGridGap(count: number, containerWidth: number, isMobileDevice: boolean): string {
	const layoutCategory = getLayoutCategory(count);
	const deviceTypeName = getDeviceType(containerWidth, isMobileDevice);
	const deviceConfig =
		DEVICE_CONFIG[deviceTypeName as keyof typeof DEVICE_CONFIG] || DEVICE_CONFIG.desktop;

	// Apply custom gap adjustment based on item count category
	const gapSize = deviceConfig.gap + (GAP_ADJUSTMENTS[layoutCategory] || 0);

	return `${gapSize}px`;
}

/**
 * Gets appropriate CSS classes for the grid based on layout
 */
function getGridClasses(
	count: number,
	containerWidth: number,
	containerHeight: number,
	isPortraitMode: boolean // Keep isPortraitMode if needed
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

	// Add aspect-based class for potential container-level styling
	const aspectClass = `${containerAspect}-aspect-container`;

	return { gridClass, aspectClass };
}

/**
 * Gets the appropriate scale factor for pictograph rendering within its container
 */
export function getPictographScaleFactor(containerWidth: number, isMobileDevice: boolean): number {
	const deviceTypeName = getDeviceType(containerWidth, isMobileDevice);
	const deviceConfig =
		DEVICE_CONFIG[deviceTypeName as keyof typeof DEVICE_CONFIG] || DEVICE_CONFIG.desktop;
	return deviceConfig.scaleFactor;
}

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
				scaleFactor: isMobileDevice ? 0.95 : 1.0 // Use default scale factors
			};
		}

		// Calculate grid configuration
		const gridConfig = calculateGridConfiguration(
			count,
			containerWidth,
			containerHeight,
			isMobileDevice,
			isPortraitMode
		);

		// Calculate item size using the corrected logic
		const optionSize = calculateItemSize({
			count,
			containerWidth,
			containerHeight,
			gridConfig,
			isMobileDevice,
			isPortraitMode // Pass isPortraitMode here
		});
		const containerAspect = getContainerAspect(containerWidth, containerHeight);

		// Get grid gap
		let gridGap = getGridGap(count, containerWidth, isMobileDevice);
		if (count === 16 && containerAspect === 'wide' && isPortraitMode) {
				// cut the grid gap in half
			gridGap = '10px';
		}
		// Get grid classes
		const { gridClass, aspectClass } = getGridClasses(
			count,
			containerWidth,
			containerHeight,
			isPortraitMode // Pass isPortraitMode here
		);

		// Get scale factor for the pictograph itself
		const scaleFactor = getPictographScaleFactor(containerWidth, isMobileDevice);

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
	100, // Cache size
	(count, containerHeight, containerWidth, isMobileDevice, isPortraitMode) =>
		// Cache key
		`${count}:${Math.round(containerHeight || 0)}:${Math.round(containerWidth || 0)}:${isMobileDevice}:${isPortraitMode}`
);
