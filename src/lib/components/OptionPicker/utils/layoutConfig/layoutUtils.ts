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

	if (width < BREAKPOINTS.tablet) return 'mobile';
	if (width < BREAKPOINTS.laptop) return 'tablet';
	return 'desktop';
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
		// Special case for 16 items
		if (count === 16) {
			// Determine columns based on container aspect
			const containerAspect = getContainerAspect(containerWidth, containerHeight);

			// If the container is very tall, use 2 columns
			if (containerAspect === 'tall' || containerHeight > containerWidth * 1.5) {
				return {
					columns: 2,
					rows: 8,
					template: 'repeat(2, minmax(0, 1fr))'
				};
			}

			// Default to 4 columns for 16 items
			return {
				columns: 4,
				rows: 4,
				template: 'repeat(4, minmax(0, 1fr))'
			};
		}

		// Existing logic for other item counts
		const layoutCategory = getLayoutCategory(count);
		const containerAspect = getContainerAspect(containerWidth, containerHeight);
		let columns = 0;

		// Handle special cases
		if (layoutCategory === 'singleItem') {
			columns = 1;
		} else if (layoutCategory === 'twoItems') {
			const useVerticalLayout =
				containerAspect === 'tall' || (containerAspect === 'square' && isPortraitMode);

			columns = useVerticalLayout
				? LAYOUT_TEMPLATES.twoItems.vertical.cols
				: LAYOUT_TEMPLATES.twoItems.horizontal.cols;
		} else {
			// For more than 2 items
			const deviceOrientation = isPortraitMode ? 'portraitDevice' : 'landscapeDevice';

			// Get base column count from layout templates
			columns = LAYOUT_TEMPLATES[layoutCategory][deviceOrientation].cols;

			// Adjust for small screens
			if (isMobileDevice && containerWidth < BREAKPOINTS.smallMobile) {
				columns = Math.min(columns, 2);
			}

			// Adjust for very large item counts
			if (count > 20) {
				columns = isPortraitMode ? Math.min(4, columns + 1) : Math.min(6, columns + 1);
			}

			// Final adjustment for very wide containers
			if (containerWidth > BREAKPOINTS.largeDesktop && !isPortraitMode) {
				columns = Math.min(8, columns + 1);
			}
		}

		// Calculate rows based on columns
		const rows = Math.ceil(count / columns);

		// Create CSS grid template
		const template = `repeat(${columns}, minmax(0, 1fr))`;

		return { columns, rows, template };
	},
	100,
	(count, width, height, isMobile, isPortrait) =>
		`${count}:${Math.round(width)}:${Math.round(height)}:${isMobile}:${isPortrait}`
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
		isPortraitMode: boolean;
	}): string => {
		const { count, containerWidth, containerHeight, gridConfig, isMobileDevice, isPortraitMode } =
			config;
		const { columns, rows } = gridConfig;

		// Early validation
		if (containerWidth <= 0 || containerHeight <= 0 || columns <= 0) {
			return isMobileDevice ? '80px' : '100px'; // Default fallback
		}

		const layoutCategory = getLayoutCategory(count);
		const containerAspect = getContainerAspect(containerWidth, containerHeight);
		const deviceType = getDeviceType(containerWidth, isMobileDevice);
		const deviceConfig = DEVICE_CONFIG[deviceType as keyof typeof DEVICE_CONFIG];

		// Calculate available space
		const horizontalPadding = deviceConfig.padding.horizontal * 2;
		const verticalPadding = deviceConfig.padding.vertical * 2;

		// Apply custom gap for different layout categories
		const gapSize = deviceConfig.gap + (GAP_ADJUSTMENTS[layoutCategory] || 0);

		// Calculate available dimensions accounting for gaps
		const availableWidth = containerWidth - horizontalPadding - gapSize * (columns - 1);
		const availableHeight = containerHeight - verticalPadding - gapSize * (rows - 1);

		let calculatedSize: number;

		// Special case for single item
		if (layoutCategory === 'singleItem') {
			const maxDimension = Math.min(containerWidth, containerHeight);
			calculatedSize = maxDimension * LAYOUT_TEMPLATES.singleItem.maxSizeFactor;
		}
		// Special case for two items
		else if (layoutCategory === 'twoItems') {
			const isVerticalLayout = columns === 1;

			if (isVerticalLayout) {
				// Vertical layout (stacked)
				calculatedSize = Math.min(availableWidth * 0.8, (availableHeight - gapSize) / 2.2);
			} else {
				// Horizontal layout (side by side)
				calculatedSize = Math.min((availableWidth - gapSize) / 2.2, availableHeight * 0.8);
			}
		}
		// Standard grid layout for 3+ items
		else {
			// Calculate size based on available space and grid dimensions
			const widthPerItem = availableWidth / columns;
			const heightPerItem = availableHeight / rows;

			// Use the smaller dimension to ensure square items fit
			calculatedSize = Math.min(widthPerItem, heightPerItem);

			// Apply device-specific scaling factor
			calculatedSize *= deviceConfig.scaleFactor;
		}

		// Get the base size for this device type and configuration

		// Adjust calculatedSize to use the baseSize
		calculatedSize = Math.min(
			Math.max(150, deviceConfig.minItemSize),
			deviceConfig.maxItemSize
		);

		return `${Math.floor(calculatedSize)}px`;
	},
	100,
	(config) =>
		`${config.count}:${Math.round(config.containerWidth)}:${Math.round(config.containerHeight)}:${config.gridConfig.columns}:${config.gridConfig.rows}:${config.isMobileDevice}:${config.isPortraitMode}`
);
/**
 * Gets the appropriate grid gap size
 */
function getGridGap(count: number, containerWidth: number, isMobileDevice: boolean): string {
	const layoutCategory = getLayoutCategory(count);
	const deviceType = getDeviceType(containerWidth, isMobileDevice);
	const deviceConfig = DEVICE_CONFIG[deviceType as keyof typeof DEVICE_CONFIG];

	// Apply custom gap for different layout categories
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
	isPortraitMode: boolean
): { gridClass: string; aspectClass: string } {
	const layoutCategory = getLayoutCategory(count);
	const containerAspect = getContainerAspect(containerWidth, containerHeight);

	let gridClass = '';

	// Set base class from layout templates
	if (layoutCategory === 'singleItem') {
		gridClass = LAYOUT_TEMPLATES.singleItem.class;
	} else if (layoutCategory === 'twoItems') {
		const useVerticalLayout =
			containerAspect === 'tall' || (containerAspect === 'square' && isPortraitMode);

		gridClass = useVerticalLayout
			? LAYOUT_TEMPLATES.twoItems.vertical.class
			: LAYOUT_TEMPLATES.twoItems.horizontal.class;
	} else {
		const deviceOrientation = isPortraitMode ? 'portraitDevice' : 'landscapeDevice';
		gridClass = LAYOUT_TEMPLATES[layoutCategory][deviceOrientation].class;
	}

	// Add aspect-based class
	const aspectClass = `${containerAspect}-aspect-container`;

	return { gridClass, aspectClass };
}

/**
 * Gets the appropriate scale factor for pictograph rendering
 */
export function getPictographScaleFactor(containerWidth: number, isMobileDevice: boolean): number {
	const deviceType = getDeviceType(containerWidth, isMobileDevice);
	return DEVICE_CONFIG[deviceType as keyof typeof DEVICE_CONFIG].scaleFactor;
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
		// Early fallback for invalid dimensions
		if (containerHeight <= 0 || containerWidth <= 0) {
			return {
				gridColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
				optionSize: isMobileDevice ? '80px' : '100px',
				gridGap: '8px',
				gridClass: '',
				aspectClass: '',
				scaleFactor: isMobileDevice ? 1 : 1
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

		// Calculate item size
		const optionSize = calculateItemSize({
			count,
			containerWidth,
			containerHeight,
			gridConfig,
			isMobileDevice,
			isPortraitMode
		});

		// Get grid gap
		const gridGap = getGridGap(count, containerWidth, isMobileDevice);

		// Get grid classes
		const { gridClass, aspectClass } = getGridClasses(
			count,
			containerWidth,
			containerHeight,
			isPortraitMode
		);

		// Get scale factor for pictograph rendering
		const scaleFactor = getPictographScaleFactor(containerWidth, isMobileDevice);

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
	(count, containerHeight, containerWidth, isMobileDevice, isPortraitMode) =>
		`${count}:${Math.round(containerHeight || 0)}:${Math.round(containerWidth || 0)}:${isMobileDevice}:${isPortraitMode}`
);
