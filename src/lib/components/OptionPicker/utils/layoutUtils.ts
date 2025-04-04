// src/lib/components/OptionPicker/utils/layoutUtils.ts
export interface GridConfiguration {
	columns: number;
	rows: number;
	template: string;
}

interface ContainerPadding {
	horizontal: number;
	vertical: number;
	gridPadding: number;
	itemPadding: number;
}

export interface ResponsiveLayoutConfig {
	gridColumns: string;
	optionSize: string;
	gridGap: string;
	gridClass: string;
	scaleFactor: number;
}

const LAYOUT_CONFIG = {
	mobilePortrait: {
		'1-4': { columns: 2 },
		'5-8': { columns: 2 },
		'9+': { columns: 4 }
	},
	mobileLandscape: {
		'1-2': { columns: 1 },
		'3-8': { columns: 2 },
		'7-12': { columns: 4 },
		'13+': { columns: 4 }
	},
	desktopPortrait: {
		'1-4': { columns: 2 },
		'5-9': { columns: 3 },
		'10-16': { columns: 4 },
		'17+': { columns: 4 }
	},
	desktopLandscape: {
		'1-4': { columns: 4 },
		'5-8': { columns: 4 },
		'9-12': { columns: 6 },
		'13-16': { columns: 4 },
		'17-24': { columns: 4 },
		'25+': { columns: 0 }
	}
} as const;

const PADDING_CONFIG: { mobile: ContainerPadding; desktop: ContainerPadding } = {
	mobile: { horizontal: 16, vertical: 16, gridPadding: 8, itemPadding: 2 },
	desktop: { horizontal: 24, vertical: 24, gridPadding: 12, itemPadding: 2 }
};

const GAP_CONFIG = {
	mobile: 8,
	desktopSingle: 0,
	desktopTwo: 24,
	desktopSmallCount: 16,
	desktopLargeCount: 12,
	desktopExactlyEight: 12
};

const SCALE_FACTOR_CONFIG = {
	mobile: 0.95,
	desktop: 1.0
};
type ContainerAspect = 'tall' | 'square' | 'wide';

// Function to determine container aspect ratio
function getContainerAspect(width: number, height: number): ContainerAspect {
	if (!width || !height) return 'square'; // Default when dimensions aren't ready

	const ratio = width / height;

	if (ratio < 0.8) return 'tall'; // Height significantly greater than width
	if (ratio > 1.3) return 'wide'; // Width significantly greater than height
	return 'square'; // Roughly square container
}
function parseRangeString(rangeString: string): { min: number; max: number } {
	if (rangeString.includes('+')) {
		const min = parseInt(rangeString.replace('+', ''), 10);
		return { min, max: Infinity };
	}
	if (rangeString.includes('-')) {
		const [min, max] = rangeString.split('-').map(Number);
		return { min, max };
	}

	const single = parseInt(rangeString, 10);
	if (!isNaN(single)) {
		return { min: single, max: single };
	}
	console.error('Invalid range string:', rangeString);
	return { min: 0, max: 0 };
}

function getLayoutConfigSet(isMobile: boolean, isPortrait: boolean) {
	if (isMobile) {
		return isPortrait ? LAYOUT_CONFIG.mobilePortrait : LAYOUT_CONFIG.mobileLandscape;
	} else {
		return isPortrait ? LAYOUT_CONFIG.desktopPortrait : LAYOUT_CONFIG.desktopLandscape;
	}
}

function getContainerPadding(isMobile: boolean): ContainerPadding {
	return isMobile ? PADDING_CONFIG.mobile : PADDING_CONFIG.desktop;
}

function getGridGapPixels(count: number, isMobile: boolean): number {
	if (isMobile) return GAP_CONFIG.mobile;
	if (count === 1) return GAP_CONFIG.desktopSingle;
	if (count === 2) return GAP_CONFIG.desktopTwo;
	if (count === 8) return GAP_CONFIG.desktopExactlyEight;

	if (count <= 12) return GAP_CONFIG.desktopSmallCount;
	return GAP_CONFIG.desktopLargeCount;
}

function pixelsToRem(pixels: number): string {
	if (pixels === 0) return '0';
	return `${(pixels / 16).toFixed(3)}rem`;
}

// 🌟 Declarative Sizing Strategy 🌟
export function calculateResponsiveOptionSize(config: {
	count: number;
	containerHeight: number;
	containerWidth: number;
	isMobile: boolean;
	isPortrait: boolean;
	gridConfig: GridConfiguration;
}): string {
	// Early guard clauses
	if (!isValidContainerDimensions(config)) {
		return getDefaultSize(config);
	}

	// Create a sizing strategy based on context
	const sizingStrategy = selectSizingStrategy(config);
	return sizingStrategy(config);
}

// Validation helpers
function isValidContainerDimensions(config: {
	containerHeight: number;
	containerWidth: number;
}): boolean {
	return config.containerHeight > 0 && config.containerWidth > 0;
}

// Centralized size selection
function selectSizingStrategy(config: {
	count: number;
	isMobile: boolean;
	isPortrait: boolean;
}): (config: any) => string {
	const strategies = {
		singleOrTwoItems: calculateSingleOrTwoItemSize,
		mobilePortrait: calculateMobilePortraitSize,
		mobileLandscape: calculateMobileLandscapeSize,
		desktopSmallCount: calculateDesktopSmallCountSize,
		desktopLargeCount: calculateDesktopLargeCountSize
	};

	if (config.count <= 2) return strategies.singleOrTwoItems;
	if (config.isMobile && config.isPortrait) return strategies.mobilePortrait;
	if (config.isMobile) return strategies.mobileLandscape;
	if (config.count < 8) return strategies.desktopSmallCount;
	return strategies.desktopLargeCount;
}

function calculateSingleOrTwoItemSize(config: {
	count: number;
	containerWidth: number;
	containerHeight: number;
	isMobile: boolean;
	gridConfig: GridConfiguration;
}): string {
	if (config.count === 2) {
		console.log('FORCING SIZE FOR 2 ITEMS');
		return config.isMobile ? '150px' : '200px'; // Use obvious sizes
	}
	const containerPadding = getContainerPadding(config.isMobile);
	const scaleFactor = config.isMobile ? SCALE_FACTOR_CONFIG.mobile : SCALE_FACTOR_CONFIG.desktop;
	const gridGapValue = getGridGapPixels(config.count, config.isMobile);

	const availableWidth =
		config.containerWidth - containerPadding.horizontal - containerPadding.gridPadding * 2;
	const availableHeight =
		config.containerHeight - containerPadding.vertical - containerPadding.gridPadding * 2;

	let potentialSize;
	const containerAspect = getContainerAspect(config.containerWidth, config.containerHeight);

	if (config.count === 1) {
		// Single item - larger size
		potentialSize = Math.min(availableWidth / 1.2, availableHeight / 1.2);
	} else {
		// Two items
		// Use larger proportions (smaller divisors) to make them bigger
		if (containerAspect === 'wide') {
			// For wide containers, place items side by side with more space
			potentialSize = Math.min((availableWidth - gridGapValue) / 2.2, availableHeight * 0.85);
		} else if (containerAspect === 'tall') {
			// For tall containers, stack items vertically
			potentialSize = Math.min(availableWidth * 0.85, (availableHeight - gridGapValue) / 2.2);
		} else {
			// square
			potentialSize = Math.min(
				(availableWidth - gridGapValue) / 2.2,
				(availableHeight - gridGapValue) / 2.2
			);
		}

		// Mobile specific adjustments
		if (config.isMobile) {
			// On mobile, make sure items are larger relative to available space
			if (containerAspect === 'wide') {
				potentialSize = Math.min((availableWidth - gridGapValue) / 2.5, availableHeight * 0.95);
			} else if (containerAspect === 'tall') {
				potentialSize = Math.min(availableWidth * 0.95, (availableHeight - gridGapValue) / 2.5);
			} else {
				potentialSize = Math.min(availableWidth * 0.8, availableHeight * 0.8) / 1.8;
			}
		}
	}

	let calculatedSize = Math.floor(potentialSize * scaleFactor) - containerPadding.itemPadding * 2;

	// Higher minimum sizes, especially for mobile
	let minSize;
	if (config.isMobile) {
		minSize = config.count === 2 ? 120 : 100; // Mobile minimums
	} else {
		minSize = config.count === 2 ? 140 : 120; // Desktop minimums
	}

	return `${Math.max(minSize, calculatedSize)}px`;
}
function calculateMobilePortraitSize(config: {
	count: number;
	containerWidth: number;
	containerHeight: number;
	gridConfig: GridConfiguration;
}): string {
	const { columns } = config.gridConfig;
	const containerPadding = getContainerPadding(true);
	const scaleFactor = SCALE_FACTOR_CONFIG.mobile;

	const availableWidth =
		config.containerWidth - containerPadding.horizontal - containerPadding.gridPadding * 2;
	const columnGaps = Math.max(0, columns - 1) * GAP_CONFIG.mobile;

	const itemSize = columns > 0 ? (availableWidth - columnGaps) / columns : availableWidth;
	const size = Math.floor(itemSize * scaleFactor) - containerPadding.itemPadding * 2;
	const maxSize = config.count > 12 ? 80 : 100;

	return `${Math.max(60, Math.min(maxSize, Math.floor(size)))}px`;
}

function calculateMobileLandscapeSize(config: {
	containerWidth: number;
	containerHeight: number;
	gridConfig: GridConfiguration;
	isMobile: boolean;
}): string {
	const { columns, rows } = config.gridConfig;
	const containerPadding = getContainerPadding(true);
	const gridGapValue = GAP_CONFIG.mobile;
	const scaleFactor = SCALE_FACTOR_CONFIG.mobile;

	const availableWidth =
		config.containerWidth - containerPadding.horizontal - containerPadding.gridPadding * 2;
	const availableHeight =
		config.containerHeight - containerPadding.vertical - containerPadding.gridPadding * 2;

	const rowGaps = Math.max(0, rows - 1) * gridGapValue;
	const maxHeightPerRow = rows > 0 ? (availableHeight - rowGaps) / rows : availableHeight;

	const columnGaps = Math.max(0, columns - 1) * gridGapValue;
	const maxWidthPerColumn = columns > 0 ? (availableWidth - columnGaps) / columns : availableWidth;

	const itemSize = Math.min(maxHeightPerRow, maxWidthPerColumn);
	const size = Math.floor(itemSize * scaleFactor) - containerPadding.itemPadding * 2;

	return `${Math.max(60, Math.floor(size))}px`;
}

function calculateDesktopSmallCountSize(config: {
	containerHeight: number;
	gridConfig: GridConfiguration;
}): string {
	const { rows } = config.gridConfig;
	const containerPadding = getContainerPadding(false);
	const rowGaps = Math.max(0, rows - 1) * GAP_CONFIG.desktopSmallCount;

	const availableHeight =
		config.containerHeight - containerPadding.vertical - containerPadding.gridPadding * 2 - 140;

	const itemHeight =
		rows > 0
			? (availableHeight - rowGaps) / rows - containerPadding.itemPadding * 2
			: availableHeight;

	return `${Math.max(80, Math.floor(itemHeight))}px`;
}

function calculateDesktopLargeCountSize(config: {
	containerHeight: number;
	gridConfig: GridConfiguration;
}): string {
	const { rows } = config.gridConfig;
	const containerPadding = getContainerPadding(false);
	const rowGaps = Math.max(0, rows - 1) * GAP_CONFIG.desktopLargeCount;

	const availableHeight =
		config.containerHeight - containerPadding.vertical - containerPadding.gridPadding * 2 - 140;

	const itemHeight =
		rows > 0
			? (availableHeight - rowGaps) / rows - containerPadding.itemPadding * 2
			: availableHeight;

	return itemHeight >= 60 ? `${Math.floor(itemHeight)}px` : 'auto';
}

function getDefaultSize(config: { isMobile: boolean }): string {
	return config.isMobile ? '80px' : '100px';
}

export function getPictographScaleFactor(isMobile: boolean): number {
	return isMobile ? SCALE_FACTOR_CONFIG.mobile : SCALE_FACTOR_CONFIG.desktop;
}

function getDefaultLayoutConfig(isMobile: boolean): ResponsiveLayoutConfig {
	return {
		gridColumns: 'repeat(2, 1fr)',
		optionSize: isMobile ? '80px' : '100px',
		gridGap: pixelsToRem(isMobile ? GAP_CONFIG.mobile : GAP_CONFIG.desktopSmallCount),
		gridClass: 'default-grid',
		scaleFactor: isMobile ? SCALE_FACTOR_CONFIG.mobile : SCALE_FACTOR_CONFIG.desktop
	};
}

export function getResponsiveLayout(
	count: number,
	containerHeight: number = 0,
	containerWidth: number = 0,
	isMobileDevice: boolean = false,
	isPortraitMode: boolean = false
): ResponsiveLayoutConfig {
	// Early return for invalid dimensions
	if (containerHeight <= 0 || containerWidth <= 0) {
		return getDefaultLayoutConfig(isMobileDevice);
	}

	// Determine aspect ratio of container
	const containerAspect = getContainerAspect(containerWidth, containerHeight);

	// Choose columns based on aspect ratio and item count
	let columns = getColumnsByAspect(containerAspect, count, isMobileDevice);

	// Calculate optimal item size
	const optionSize = calculateItemSize(containerWidth, containerHeight, columns, count);

	// Create responsive layout config
	return {
		gridColumns: `repeat(${columns}, 1fr)`,
		optionSize: `${optionSize}px`,
		gridGap: pixelsToRem(getGridGapPixels(count, isMobileDevice)),
		gridClass: getGridClass(containerAspect, count),
		scaleFactor: isMobileDevice ? 0.95 : 1.0
	};
}

// Helper function to determine column count by aspect ratio
function getColumnsByAspect(aspect: ContainerAspect, count: number, isMobile: boolean): number {
	if (count <= 2) return count; // Special case for 1-2 items

	if (aspect === 'tall') {
		return isMobile ? 2 : Math.min(2, count);
	} else if (aspect === 'wide') {
		const maxColumns = Math.min(8, count);
		return isMobile ? Math.min(4, maxColumns) : maxColumns;
	} else {
		// square
		if (count <= 4) return 2;
		if (count <= 9) return 3;
		if (count <= 16) return 4;
		return Math.min(6, Math.ceil(Math.sqrt(count)));
	}
}

// Calculate item size to ensure proper fit within container
// Calculate item size to ensure proper fit within container
function calculateItemSize(width: number, height: number, columns: number, count: number): number {
	if (count === 2) {
		console.log('Responsive sizing for 2 items');

		// Get container aspect ratio
		const containerAspect = getContainerAspect(width, height);

		// Calculate available space with reduced padding for 2-item case
		const paddingH = 40;
		const paddingV = 40;
		const gapSize = 16; // Slightly larger gap for two items

		const availableWidth = width - paddingH;
		const availableHeight = height - paddingV;

		let size;

		if (containerAspect === 'wide') {
			// Side-by-side layout
			size = Math.min(
				(availableWidth - gapSize) / 2.5, // Use 2.5 instead of 2 to leave some margin
				availableHeight * 0.8 // Use 80% of height
			);
		} else if (containerAspect === 'tall') {
			// Stacked layout
			size = Math.min(
				availableWidth * 0.8, // Use 80% of width
				(availableHeight - gapSize) / 2.5 // Use 2.5 instead of 2 to leave some margin
			);
		} else {
			// Square container - use whichever layout gives larger items
			const sideSize = (availableWidth - gapSize) / 2.5;
			const stackedSize = (availableHeight - gapSize) / 2.5;
			size = Math.max(sideSize, stackedSize);
		}

		// Apply a minimum size but keep it responsive to container
		const minSize = Math.min(120, Math.max(availableWidth, availableHeight) * 0.3);
		const maxSize = Math.min(300, Math.max(availableWidth, availableHeight) * 0.6);

		return Math.max(minSize, Math.min(size, maxSize));
	}

	// Regular case (non-two items) continues with the original logic
	const rows = Math.ceil(count / columns);

	// Account for padding and gaps
	const paddingH = 40;
	const paddingV = 40;
	const gapSize = 8;

	// Calculate available dimensions
	const availableWidth = width - paddingH - gapSize * (columns - 1);
	const availableHeight = height - paddingV - gapSize * (rows - 1);

	// Calculate size ensuring square aspect ratio
	const sizeByWidth = availableWidth / columns;
	const sizeByHeight = availableHeight / rows;

	// Use the smaller of the two dimensions to ensure items fit
	const size = Math.floor(Math.min(sizeByWidth, sizeByHeight));

	// Apply constraints
	return Math.max(60, Math.min(size, 160));
}
// Add grid class based on aspect ratio
function getGridClass(aspect: ContainerAspect, count: number): string {
	if (count === 1) return 'single-item-grid';
	if (count === 2) return 'two-item-grid';
	if (count === 3) return 'three-item-grid';
	if (count === 4) return 'four-item-grid';
	if (count === 8) return 'eight-item-grid';
	if (count === 12) return 'twelve-item-grid';
	if (count === 16) return 'sixteen-item-grid';
	return `${aspect}-aspect-grid`;
}
