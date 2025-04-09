export const DEFAULT_COLUMNS = {
	singleItem: 1,
	twoItems: {
		vertical: 1,
		horizontal: 2,
	},
	fewItems: 4,
	mediumItems: 4,
	manyItems: 4,
};

interface FoldableInfo {
	isFoldable: boolean;
	isUnfolded: boolean;
	foldableType: 'zfold';
}

interface LayoutParams {
	foldableInfo?: FoldableInfo;
	isPortraitMode?: boolean;
	device?: 'desktop' | 'mobile';
	aspect?: 'tall' | 'wide' | 'widish' | 'square';
	orientation?: 'landscape' | 'portrait';
}

type ExtraCheck = (width: number, height: number, params?: LayoutParams) => boolean;

interface LayoutRule {
	description: string;
	columns: number | '+1';
	maxColumns?: number;
	when: {
		count?: number;
		minCount?: number;
		maxCount?: number;
		device?: 'desktop' | 'mobile';
		aspect?: 'tall' | 'wide' | 'widish' | 'square';
		orientation?: 'landscape' | 'portrait';
		extraCheck?: ExtraCheck;
	};
}

export const LAYOUT_RULES: LayoutRule[] = [

	{
		description: "Z-Fold unfolded portrait - medium items",
		columns: 4,
		when: {
			minCount: 9,
			maxCount: 16,
			extraCheck: (w, h, params) =>
				params?.foldableInfo?.isFoldable === true &&
				params?.foldableInfo?.isUnfolded === true &&
				params?.foldableInfo?.foldableType === 'zfold' &&
				params.isPortraitMode === true,
		},
	},
	{
		description: "Z-Fold unfolded landscape - medium items",
		columns: 4,
		when: {
			minCount: 9,
			maxCount: 16,
			extraCheck: (w, h, params) =>
				params?.foldableInfo?.isFoldable === true &&
				params?.foldableInfo?.isUnfolded === true &&
				params?.foldableInfo?.foldableType === 'zfold' &&
				params.isPortraitMode === false,
		},
	},
	{
		description: "Z-Fold unfolded portrait - many items",
		columns: 4,
		when: {
			minCount: 17,
			extraCheck: (w, h, params) =>
				params?.foldableInfo?.isFoldable === true &&
				params?.foldableInfo?.isUnfolded === true &&
				params?.foldableInfo?.foldableType === 'zfold' &&
				params.isPortraitMode === true,
		},
	},
	{
		description: "Z-Fold unfolded landscape - many items",
		columns: 4,
		when: {
			minCount: 17,
			extraCheck: (w, h, params) =>
				params?.foldableInfo?.isFoldable === true &&
				params?.foldableInfo?.isUnfolded === true &&
				params?.foldableInfo?.foldableType === 'zfold' &&
				params.isPortraitMode === false,
		},
	},
	{
		description: "Z-Fold folded - use standard mobile layout",
		columns: 4,
		when: {
			minCount: 3,
			extraCheck: (w, h, params) =>
				params?.foldableInfo?.isFoldable === true &&
				params?.foldableInfo?.isUnfolded === false &&
				params?.foldableInfo?.foldableType === 'zfold',
		},
	},
	{
		description: '1 item = 1 column',
		columns: 1,
		when: { count: 1 },
	},
	{
		description: 'Two items always = max 2 columns',
		columns: 2,
		when: { count: 2, aspect: 'wide' },
	},
	{
		description: '8 items in tall container = 2 columns',
		columns: 2,
		when: { count: 8, aspect: 'tall' },
	},
	{
		description: '16 items on desktop, super tall = 2 columns',
		columns: 2,
		when: {
			count: 16,
			device: 'desktop',
			aspect: 'tall',
			extraCheck: (w, h) => h > w * 1.8,
		},
	},
	{
		description: '16 items on desktop, super wide = 8 columns',
		columns: 8,
		when: {
			count: 16,
			device: 'desktop',
			aspect: 'wide',
			extraCheck: (w, h) => h < w * 0.5,
		},
	},
	{
		description: '16 items on desktop (standard) = 4 columns',
		columns: 4,
		when: { count: 16, device: 'desktop' },
	},
	{
		description: 'Mobile with wide container = 4 columns',
		columns: 4,
		when: {
			device: 'mobile',
			aspect: 'wide',
		},
	},
	{
		description: 'Many items on desktop, wide aspect = 8 columns',
		columns: 8,
		when: { minCount: 17, device: 'desktop', aspect: 'wide' },
	},
	{
		description: 'More than 16 items on desktop, widish/square = 6 columns',
		columns: 6,
		when: {
			minCount: 17,
			device: 'desktop',
			aspect: "square"
		},
	},
	{
		description: 'Many items on desktop, tall = 4 columns',
		columns: 4,
		when: { minCount: 17, device: 'desktop', aspect: 'tall' },
	},
	{
		description: 'Many items on mobile, wide = 6 columns',
		columns: 6,
		when: { minCount: 17, device: 'mobile', aspect: 'wide' },
	},
	{
		description: 'Many items on mobile, widish/square = 4 columns',
		columns: 4,
		when: {
			minCount: 17,
			device: 'mobile',
			aspect: "square"
		},
	},
	{
		description: 'Many items on mobile, tall = 3 columns',
		columns: 4,
		when: { minCount: 17, device: 'mobile', aspect: 'tall' },
	},
	{
		description: 'Very wide desktop gets +1 column',
		columns: '+1',
		maxColumns: 8,
		when: {
			device: 'desktop',
			orientation: 'landscape',
			extraCheck: (w) => w > 1600,
		},
	},
];

interface GridGapOverride {
	description: string;
	gap: string;
	when: {
		count?: number;
		minCount?: number;
		maxCount?: number;
		aspect?: 'tall' | 'wide';
		orientation?: 'portrait' | 'landscape';
		extraCheck?: ExtraCheck;
	};
}

export const GRID_GAP_OVERRIDES: GridGapOverride[] = [
	{
		description: '16 items in wide landscape = 10px gap',
		gap: '10px',
		when: { count: 16, aspect: 'wide', orientation: 'portrait' },
	},
	{
		description: 'Z-Fold unfolded with many items = smaller 6px gap',
		gap: '6px',
		when: {
			minCount: 12,
			extraCheck: (w, h, params) =>
				params?.foldableInfo?.isFoldable === true &&
				params?.foldableInfo?.isUnfolded === true &&
				params?.foldableInfo?.foldableType === 'zfold',
		},
	},
	{
		description: 'Z-Fold unfolded with few items = 8px gap',
		gap: '8px',
		when: {
			maxCount: 11,
			extraCheck: (w, h, params) =>
				params?.foldableInfo?.isFoldable === true &&
				params?.foldableInfo?.isUnfolded === true &&
				params?.foldableInfo?.foldableType === 'zfold',
		},
	},
];
