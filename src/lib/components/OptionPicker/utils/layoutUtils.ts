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
		'13-16': { columns: 8 },
		'17-24': { columns: 8 },
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

function calculateGridConfiguration(
	count: number,
	isMobile: boolean,
	isPortrait: boolean
): GridConfiguration {
	const configSet = getLayoutConfigSet(isMobile, isPortrait);

	const rangeKey = Object.keys(configSet).find((key) => {
		const { min, max } = parseRangeString(key);
		return count >= min && count <= max;
	}) as keyof typeof configSet | undefined;

	const effectiveKey = rangeKey ?? (Object.keys(configSet).pop() as keyof typeof configSet);

	let columns = (configSet[effectiveKey] as { columns: number }).columns;

	if (columns === 0) {
		columns = Math.max(4, Math.ceil(Math.sqrt(count)));
	}

	const rows = Math.ceil(count / columns);
	const template = `repeat(${columns}, minmax(0, 1fr))`;

	return { columns, rows, template };
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

// Specific sizing strategies
function calculateSingleOrTwoItemSize(config: {
	count: number;
	containerWidth: number;
	containerHeight: number;
	isMobile: boolean;
	gridConfig: GridConfiguration;
}): string {
	const containerPadding = getContainerPadding(config.isMobile);
	const scaleFactor = config.isMobile ? SCALE_FACTOR_CONFIG.mobile : SCALE_FACTOR_CONFIG.desktop;
	const gridGapValue = getGridGapPixels(config.count, config.isMobile);

	const availableWidth = config.containerWidth;
	const availableHeight = config.containerHeight;

	const potentialSize =
		config.count === 1
			? Math.min(availableWidth / 2, availableHeight / 2)
			: Math.min((availableWidth - gridGapValue) / 1.5, availableHeight);

	let calculatedSize = Math.floor(potentialSize * scaleFactor) - containerPadding.itemPadding * 2;
	calculatedSize = Math.max(80, calculatedSize);

	return `${calculatedSize}px`;
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

export function getGridClass(count: number, isMobile: boolean): string {
	if (count === 2 && !isMobile) return 'two-item-grid';
	if (isMobile) return 'mobile-grid';
	if (count === 8) return 'exactly-eight';

	if (count > 2 && count < 8) return 'small-count';

	return '';
}

export function getResponsiveLayout(
	count: number,
	containerHeight: number = 0,
	containerWidth: number = 0,
	isMobile: boolean = false,
	isPortrait: boolean = false
): ResponsiveLayoutConfig {
	if (containerHeight <= 0 || containerWidth <= 0) {
		// Provide a sensible default layout
		return {
			gridColumns: 'repeat(auto-fit, minmax(100px, 1fr))', // Flexible grid
			optionSize: '100px', // Default size
			gridGap: '0.5rem',
			gridClass: isMobile ? 'mobile-grid' : '',
			scaleFactor: isMobile ? 0.95 : 1.0
		};
	}

	const gridConfig = calculateGridConfiguration(count, isMobile, isPortrait);
	let finalGridColumns = gridConfig.template;

	const optionSizePx = calculateResponsiveOptionSize({
		count,
		containerHeight,
		containerWidth,
		isMobile,
		isPortrait,
		gridConfig
	});

	const gridGapPx = getGridGapPixels(count, isMobile);
	const gridGapRem = pixelsToRem(gridGapPx);
	const gridClass = getGridClass(count, isMobile);
	const scaleFactor = getPictographScaleFactor(isMobile);

	return {
		gridColumns: finalGridColumns,
		optionSize: optionSizePx,
		gridGap: gridGapRem,
		gridClass: gridClass,
		scaleFactor: scaleFactor
	};
}
