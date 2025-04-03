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

const layoutConfig = {
	mobilePortrait: {
		'1-4': { columns: 2 },
		'5-8': { columns: 3 },
		'9+': { columns: 4 }
	},

	mobileLandscape: {
		'1-4': { columns: 2 },
		'5-12': { columns: 2 },
		'13+': { columns: 4 }
	},

	desktopPortrait: {
		'1-4': { columns: 2 },
		'5-16': { columns: 4 },
		'17+': { columns: 6 }
	},

	desktopLandscape: {
		'1-4': { columns: 4 },
		'5-8': { columns: 2 },
		'9-12': { columns: 6 },
		'13-24': { columns: 8 },
		'25+': { columns: 0 }
	}
};

const paddingConfig = {
	mobile: {
		horizontal: 20,
		vertical: 20,
		gridPadding: 10,
		itemPadding: 2
	},
	desktop: {
		horizontal: 40,
		vertical: 40,
		gridPadding: 10,
		itemPadding: 2
	}
};

const gapConfig = {
	mobile: 0,
	desktopNormal: 15,
	desktopEight: 10
};

const scaleFactorConfig = {
	mobile: 1.0,
	desktop: 1.0
};

function parseRangeString(rangeString: string): { min: number; max: number } {
	if (rangeString.includes('+')) {
		const min = parseInt(rangeString.split('+')[0]);
		return { min, max: 1000 };
	}

	if (rangeString.includes('-')) {
		const [min, max] = rangeString.split('-').map(Number);
		return { min, max };
	}

	const single = parseInt(rangeString);
	return { min: single, max: single };
}

export function getOptimalGridColumns(
	count: number,
	isMobile: boolean,
	isPortrait: boolean
): GridConfiguration {
	let configSet: Record<string, { columns: number }>;

	if (isMobile && isPortrait) {
		configSet = layoutConfig.mobilePortrait;
	} else if (isMobile && !isPortrait) {
		configSet = layoutConfig.mobileLandscape;
	} else if (!isMobile && isPortrait) {
		configSet = layoutConfig.desktopPortrait;
	} else {
		configSet = layoutConfig.desktopLandscape;
	}

	const rangeKey =
		Object.keys(configSet).find((key) => {
			const { min, max } = parseRangeString(key);
			return count >= min && count <= max;
		}) || Object.keys(configSet)[Object.keys(configSet).length - 1];

	let columns = configSet[rangeKey].columns;

	if (columns === 0) {
		columns = Math.ceil(Math.sqrt(count));
	}

	const rows = Math.ceil(count / columns);

	const template = `repeat(${columns}, 1fr)`;

	return { columns, rows, template };
}

export function getGridClass(count: number, isMobile: boolean): string {
	if (count === 8 && !isMobile) return 'exactly-eight';
	if (count <= 8) return 'small-count';
	return '';
}

export function getGridGap(count: number, isMobile: boolean): string {
	if (isMobile) return `${gapConfig.mobile / 16}rem`;
	if (count === 8) return `${gapConfig.desktopEight / 16}rem`;
	return `${gapConfig.desktopNormal / 16}rem`;
}

function getGridGapPixels(count: number, isMobile: boolean): number {
	if (isMobile) return gapConfig.mobile;
	if (count === 8) return gapConfig.desktopEight;
	return gapConfig.desktopNormal;
}

function getContainerPadding(isMobile: boolean): ContainerPadding {
	return isMobile ? paddingConfig.mobile : paddingConfig.desktop;
}
export function getOptionSize(
	count: number,
	containerHeight: number = 0,
	containerWidth: number = 0,
	gridConfig: GridConfiguration,
	isMobile: boolean = false,
	isPortrait: boolean = false
): string {
	if (!containerHeight || !containerWidth) return 'auto';

	const { columns, rows } = gridConfig;
	const containerPadding = getContainerPadding(isMobile);
	const gridGapValue = getGridGapPixels(count, isMobile);
	const scaleFactor = isMobile ? scaleFactorConfig.mobile : scaleFactorConfig.desktop;

	if (isMobile) {
		// For mobile, use both dimensions to get the best fit
		const availableWidth =
			containerWidth - containerPadding.horizontal - containerPadding.gridPadding * 2;
		const availableHeight =
			containerHeight - containerPadding.vertical - containerPadding.gridPadding * 2;

		// For landscape, we generally want more rows visible
		if (!isPortrait) {
			// Calculate how much height each row can have
			const rowGaps = gridGapValue * (rows - 1);
			const maxHeightPerRow = (availableHeight - rowGaps) / rows;

			// Calculate how much width each column can have
			const columnGaps = gridGapValue * (columns - 1);
			const maxWidthPerColumn = (availableWidth - columnGaps) / columns;

			// Use the smaller dimension to maintain square aspect ratio
			const itemSize = Math.min(maxHeightPerRow, maxWidthPerColumn);
			const size = Math.floor(itemSize * scaleFactor) - containerPadding.itemPadding * 2;

			// For many items in landscape, set a reasonable max size
			return `${Math.max(60, Math.min(size, size))}px`;
		}

		// For portrait, prioritize width-based sizing
		const columnGaps = gridGapValue * (columns - 1);
		const itemSize = (availableWidth - columnGaps) / columns;
		const size = Math.floor(itemSize * scaleFactor) - containerPadding.itemPadding * 2;

		// For portrait, let it be a bit bigger but still cap for many items
		const maxSize = count > 12 ? 80 : 100;
		return `${Math.max(60, Math.min(maxSize, size))}px`;
	}

	if (count === 8 && !isMobile) {
		const availableHeight =
			containerHeight - containerPadding.vertical - containerPadding.gridPadding * 2;
		const availableWidth =
			containerWidth - containerPadding.horizontal - containerPadding.gridPadding * 2;

		const rowGaps = gridGapValue * (rows - 1);
		const columnGaps = gridGapValue * (columns - 1);

		const maxHeightBasedOnContainer =
			(availableHeight - rowGaps) / rows - containerPadding.itemPadding * 2;
		const maxWidthBasedOnContainer =
			(availableWidth - columnGaps) / columns - containerPadding.itemPadding * 2;

		const size = Math.min(maxHeightBasedOnContainer, maxWidthBasedOnContainer);

		return `${Math.max(100, Math.floor(size))}px`;
	}

	if (count < 8 && !isMobile) {
		const availableHeight =
			containerHeight - containerPadding.vertical - containerPadding.gridPadding * 2 - 140;
		const rowGaps = gridGapValue * (rows - 1);
		const itemHeight = (availableHeight - rowGaps) / rows - containerPadding.itemPadding * 2;
		return `${Math.max(80, Math.floor(itemHeight))}px`;
	}

	if (count <= 24 && !isMobile) {
		const availableHeight =
			containerHeight - containerPadding.vertical - containerPadding.gridPadding * 2 - 140;
		const rowGaps = gridGapValue * (rows - 1);
		const itemHeight = (availableHeight - rowGaps) / rows - containerPadding.itemPadding * 2;
		if (itemHeight >= 60) {
			return `${Math.floor(itemHeight)}px`;
		}
	}

	return 'auto';
}

export function getPictographScaleFactor(isMobile: boolean): number {
	return isMobile ? scaleFactorConfig.mobile : scaleFactorConfig.desktop;
}

export interface ResponsiveLayoutConfig {
	gridColumns: string;
	optionSize: string;
	gridGap: string;
	gridClass: string;
	scaleFactor: number;
}

export function getResponsiveLayout(
	count: number,
	containerHeight: number = 0,
	containerWidth: number = 0,
	isMobile: boolean = false,
	isPortrait: boolean = false
): ResponsiveLayoutConfig {
	const gridConfig = getOptimalGridColumns(count, isMobile, isPortrait);

	return {
		gridColumns: gridConfig.template,
		optionSize: getOptionSize(
			count,
			containerHeight,
			containerWidth,
			gridConfig,
			isMobile,
			isPortrait
		),
		gridGap: getGridGap(count, isMobile),
		gridClass: getGridClass(count, isMobile),
		scaleFactor: getPictographScaleFactor(isMobile)
	};
}
