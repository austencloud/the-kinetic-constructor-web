import { memoizeLRU } from '$lib/utils/memoizationUtils';

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

// --- Configuration Constants ---

const LAYOUT_CONFIG = {
	mobilePortrait: { '1-4': { columns: 2 }, '5-8': { columns: 2 }, '9+': { columns: 4 } },
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

const SCALE_FACTOR_CONFIG = { mobile: 0.95, desktop: 1.0 };

// --- Helper Functions ---

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
	if (!isNaN(single)) return { min: single, max: single };
	console.error('Invalid range string:', rangeString);
	return { min: 0, max: 0 };
}

function getLayoutConfigSet(isMobile: boolean, isPortrait: boolean) {
	if (isMobile) return isPortrait ? LAYOUT_CONFIG.mobilePortrait : LAYOUT_CONFIG.mobileLandscape;
	return isPortrait ? LAYOUT_CONFIG.desktopPortrait : LAYOUT_CONFIG.desktopLandscape;
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

// --- Core Calculation Functions ---

const calculateGridConfiguration = memoizeLRU(
	(count: number, isMobile: boolean, isPortrait: boolean): GridConfiguration => {
		const configSet = getLayoutConfigSet(isMobile, isPortrait);
		const rangeKey = Object.keys(configSet).find((key) => {
			const { min, max } = parseRangeString(key);
			return count >= min && count <= max;
		}) as keyof typeof configSet | undefined;
		const effectiveKey = rangeKey ?? (Object.keys(configSet).pop() as keyof typeof configSet);
		let columns = (configSet[effectiveKey] as { columns: number }).columns;
		if (columns === 0) columns = Math.max(4, Math.ceil(Math.sqrt(count)));
		const rows = Math.ceil(count / columns);
		const template = `repeat(${columns}, minmax(0, 1fr))`;
		return { columns, rows, template };
	},
	50,
	(count, isMobile, isPortrait) => `${count}:${isMobile}:${isPortrait}`
);

const calculateResponsiveOptionSize = memoizeLRU(
	(config: {
		count: number;
		containerHeight: number;
		containerWidth: number;
		isMobile: boolean;
		isPortrait: boolean;
		gridConfig: GridConfiguration;
	}): string => {
		const { count, containerHeight, containerWidth, isMobile, gridConfig } = config;
		const { columns, rows } = gridConfig;

		if (containerHeight <= 0 || containerWidth <= 0 || columns <= 0 || rows <= 0) {
			return isMobile ? '80px' : '100px';
		}

		const containerPadding = getContainerPadding(isMobile);
		const gridGapValue = getGridGapPixels(count, isMobile);
		const scaleFactor = isMobile ? SCALE_FACTOR_CONFIG.mobile : SCALE_FACTOR_CONFIG.desktop;

		const availableWidth =
			containerWidth - containerPadding.horizontal - containerPadding.gridPadding * 2;
		const columnGapsTotalWidth = Math.max(0, columns - 1) * gridGapValue;
		const widthPerItem = (availableWidth - columnGapsTotalWidth) / columns;

		const availableHeight =
			containerHeight - containerPadding.vertical - containerPadding.gridPadding * 2;
		const rowGapsTotalHeight = Math.max(0, rows - 1) * gridGapValue;
		const heightPerItem = (availableHeight - rowGapsTotalHeight) / rows;

		const limitingSize = Math.floor(Math.min(widthPerItem, heightPerItem));

		let calculatedSize = Math.floor(limitingSize * scaleFactor) - containerPadding.itemPadding * 2;

		const minSize = 60;
		const maxSize = 200;
		calculatedSize = Math.max(minSize, Math.min(calculatedSize, maxSize));

		return `${calculatedSize}px`;
	},
	100,
	(config) =>
		`${config.count}:${Math.round(config.containerHeight)}:${Math.round(config.containerWidth)}:${config.isMobile}:${config.isPortrait}:${config.gridConfig.columns}:${config.gridConfig.rows}`
);

function getGridClass(count: number, isMobile: boolean): string {
	if (count === 2 && !isMobile) return 'two-item-grid';
	if (isMobile) return 'mobile-grid';
	return '';
}

// --- Main Exported Function ---

export const getResponsiveLayout = memoizeLRU(
	(
		count: number,
		containerHeight: number = 0,
		containerWidth: number = 0,
		isMobile: boolean = false,
		isPortrait: boolean = false
	): ResponsiveLayoutConfig => {
		if (containerHeight <= 0 || containerWidth <= 0) {
			return {
				gridColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
				optionSize: '100px',
				gridGap: '0.5rem',
				gridClass: isMobile ? 'mobile-grid' : '',
				scaleFactor: isMobile ? SCALE_FACTOR_CONFIG.mobile : SCALE_FACTOR_CONFIG.desktop
			};
		}

		const gridConfig = calculateGridConfiguration(count, isMobile, isPortrait);

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
		const scaleFactor = isMobile ? SCALE_FACTOR_CONFIG.mobile : SCALE_FACTOR_CONFIG.desktop;

		return {
			gridColumns: gridConfig.template,
			optionSize: optionSizePx,
			gridGap: gridGapRem,
			gridClass: gridClass,
			scaleFactor: scaleFactor
		};
	},
	50,
	(count, containerHeight, containerWidth, isMobile, isPortrait) =>
		`${count}:${Math.round(containerHeight || 0)}:${Math.round(containerWidth || 0)}:${isMobile}:${isPortrait}`
);
