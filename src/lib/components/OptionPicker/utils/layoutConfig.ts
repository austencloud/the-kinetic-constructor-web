// src/lib/components/OptionPicker/utils/layoutConfig.ts
// This file contains human-editable layout configurations

// =============================================================
// DEFAULT COLUMN COUNTS
// Simply set how many columns each layout type should have
// =============================================================
export const DEFAULT_COLUMNS = {
	// Single item is always 1 column
	singleItem: 1,

	// Two items can be vertical (1 column) or horizontal (2 columns)
	twoItems: {
		vertical: 1,
		horizontal: 2
	},

	// Standard grid layouts
	fewItems: 4, // 3-8 items
	mediumItems: 4, // 9-16 items
	manyItems: 4 // 17+ items
};

// =============================================================
// LAYOUT RULES - SUPER EASY TO EDIT!
// =============================================================
export const LAYOUT_RULES = [
	// Example format:
	// { description: "Human readable description", columns: 3, when: { count: 8, aspect: "tall" } }

	//====================== SPECIAL LAYOUTS FOR SPECIFIC ITEM COUNTS ======================
	// 1 item is always 1 column
	{
		description: '1 item = 1 column',
		columns: 1,
		when: { count: 1 }
	},
	{
		description: 'Two items always = max 2 columns',
		columns: 2,
		when: { count: 2, aspect: 'wide' }
	},
	// 8 items in tall container
	{
		description: '8 items in tall container = 2 columns',
		columns: 2,
		when: { count: 8, aspect: 'tall' }
	},
	{
		description: 'Z-Fold unfolded - limit to 4 columns max',
		columns: 4,
		when: {
			extraCheck: (
				w: any,
				h: any,
				params: { foldableInfo: { isFoldable: any; isUnfolded: any; foldableType: string } }
			) =>
				params?.foldableInfo?.isFoldable &&
				params?.foldableInfo?.isUnfolded &&
				params?.foldableInfo?.foldableType === 'zfold'
		}
	},
	{
		description: 'Z-Fold unfolded with many items - limit to 6 columns',
		columns: 4,
		when: {
			minCount: 17,
			extraCheck: (
				w: any,
				h: any,
				params: { foldableInfo: { isFoldable: any; isUnfolded: any; foldableType: string } }
			) =>
				params?.foldableInfo?.isFoldable &&
				params?.foldableInfo?.isUnfolded &&
				params?.foldableInfo?.foldableType === 'zfold'
		}
	},
	// 16 items - special desktop layouts based on aspect ratio
	{
		description: '16 items on desktop, super tall = 2 columns',
		columns: 2,
		when: {
			count: 16,
			device: 'desktop',
			aspect: 'tall',
			extraCheck: (w: number, h: number) => h > w * 1.8 // Very tall
		}
	},
	{
		description: '16 items on desktop, super wide = 8 columns',
		columns: 8,
		when: {
			count: 16,
			device: 'desktop',
			aspect: 'wide',
			extraCheck: (w: number, h: number) => h < w * 0.5 // Very wide
		}
	},
	{
		description: '16 items on desktop (standard) = 4 columns',
		columns: 4,
		when: { count: 16, device: 'desktop' }
	},

	//====================== MOBILE DEVICE LAYOUTS ======================

	// Wide mobile screens get 4 columns
	{
		description: 'Mobile with wide container = 4 columns',
		columns: 4,
		when: {
			device: 'mobile',
			aspect: 'wide'
		}
	},

	//====================== MANY ITEMS LAYOUT PREFERENCES ======================

	// More than 16 items - tailor columns based on aspect ratio
	// Desktop rules
	{
		description: 'Many items on desktop, wide aspect = 8 columns',
		columns: 8,
		when: { minCount: 17, device: 'desktop', aspect: 'wide' }
	},
	{
		description: 'More than 16 items on desktop, widish/square = 6 columns',
		columns: 8,
		when: {
			minCount: 17,
			device: 'desktop',
			aspects: ['widish', 'square']
		}
	},
	{
		description: 'Many items on desktop, tall = 4 columns',
		columns: 4,
		when: { minCount: 17, device: 'desktop', aspect: 'tall' }
	},

	// Mobile rules
	{
		description: 'Many items on mobile, wide = 6 columns',
		columns: 4,
		when: { minCount: 17, device: 'mobile', aspect: 'wide' }
	},
	{
		description: 'Many items on mobile, widish/square = 4 columns',
		columns: 4,
		when: {
			minCount: 17,
			device: 'mobile',
			aspects: ['widish', 'square']
		}
	},
	{
		description: 'Many items on mobile, tall = 4 columns',
		columns: 4,
		when: { minCount: 17, device: 'mobile', aspect: 'tall' }
	},

	//====================== SPECIAL ADJUSTMENTS ======================

	// Very wide desktop gets +1 column (up to 8 max)
	{
		description: 'Very wide desktop gets +1 column',
		columns: '+1', // Special value means "add 1 to base columns"
		maxColumns: 8, // But never more than 8
		when: {
			device: 'desktop',
			orientation: 'landscape',
			extraCheck: (w: number) => w > 1600
		}
	}
];

// =============================================================
// GRID GAP SPECIAL CASES
// =============================================================
export const GRID_GAP_OVERRIDES = [
	{
		description: '16 items in wide landscape = 10px gap',
		gap: '10px',
		when: { count: 16, aspect: 'wide', orientation: 'portrait' }
	}
];
