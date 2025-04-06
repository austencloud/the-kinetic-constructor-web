// Layout configurations for different item counts
export const LAYOUT_TEMPLATES = {
	singleItem: {
		cols: 1,
		aspectRatio: 1,
		maxSizeFactor: 0.7, // Use up to 70% of available space
		class: 'single-item-grid'
	},
	twoItems: {
		horizontal: { cols: 2, aspectRatio: 2, class: 'two-item-grid horizontal-layout' },
		vertical: { cols: 1, aspectRatio: 0.5, class: 'two-item-grid vertical-layout' }
	},
	fewItems: {
		// 3-6 items
		portraitDevice: { cols: 2, class: 'few-items-grid' },
		landscapeDevice: { cols: 3, class: 'few-items-grid' }
	},
	mediumItems: {
		// 7-12 items
		portraitDevice: { cols: 3, class: 'medium-items-grid' },
		landscapeDevice: { cols: 4, class: 'medium-items-grid' }
	},
	manyItems: {
		// 13+ items
		portraitDevice: { cols: 3, class: 'many-items-grid' },
		landscapeDevice: { cols: 5, class: 'many-items-grid' }
	}
};
