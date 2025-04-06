// src/lib/components/OptionPicker/config.ts
import type { PictographData } from '$lib/types/PictographData';

// ----- Types -----
export type DeviceType = 'smallMobile' | 'mobile' | 'tablet' | 'desktop' | 'largeDesktop';
export type ContainerAspect = 'tall' | 'square' | 'wide' | 'widish';
export type SortMethod = 'type' | 'endPosition' | 'reversals';
export type ReversalFilter = 'all' | 'continuous' | 'oneReversal' | 'twoReversals';
export type LayoutCategory = 'singleItem' | 'twoItems' | 'fewItems' | 'mediumItems' | 'manyItems';

export interface ResponsiveLayoutConfig {
	gridColumns: string;
	optionSize: string;
	gridGap: string;
	gridClass: string;
	aspectClass: string;
	scaleFactor: number;
}

// ----- Breakpoints -----
export const BREAKPOINTS = {
	smallMobile: 375,
	mobile: 480,
	tablet: 768,
	laptop: 1024,
	desktop: 1280,
	largeDesktop: 1600
};

// ----- Aspect Ratio Thresholds -----
export const ASPECT_RATIO = {
	tall: 0.8,
	square: 1.3,
	widish: 1.7,
	wide: 2.0
};

// ----- Device Configuration -----
export const DEVICE_CONFIG = {
	smallMobile: {
		padding: { horizontal: 8, vertical: 8 },
		gap: 2,
		minItemSize: 60,
		maxItemSize: 90,
		scaleFactor: 0.95
	},
	mobile: {
		padding: { horizontal: 12, vertical: 12 },
		gap: 20,
		minItemSize: 80,
		maxItemSize: 175,
		scaleFactor: 1
	},
	tablet: {
		padding: { horizontal: 16, vertical: 16 },
		gap: 2,
		minItemSize: 80,
		maxItemSize: 175,
		scaleFactor: 1
	},
	desktop: {
		padding: { horizontal: 20, vertical: 20 },
		gap: 2,
		minItemSize: 90,
		maxItemSize: 180,
		scaleFactor: 1.0
	},
	largeDesktop: {
		padding: { horizontal: 24, vertical: 24 },
		gap: 20,
		minItemSize: 100,
		maxItemSize: 200,
		scaleFactor: 1.1
	}
};

// ----- Layout Templates -----
export const LAYOUT_TEMPLATES = {
	singleItem: {
		cols: 1,
		class: 'single-item-grid'
	},
	twoItems: {
		horizontal: { cols: 2, class: 'two-item-grid horizontal-layout' },
		vertical: { cols: 1, class: 'two-item-grid vertical-layout' }
	},
	fewItems: {
		portraitDevice: { cols: 4, class: 'few-items-grid' },
		landscapeDevice: { cols: 4, class: 'few-items-grid' }
	},
	mediumItems: {
		portraitDevice: { cols: 4, class: 'medium-items-grid' },
		landscapeDevice: { cols: 4, class: 'medium-items-grid' }
	},
	manyItems: {
		portraitDevice: { cols: 4, class: 'many-items-grid' },
		landscapeDevice: { cols: 4, class: 'many-items-grid' }
	}
};

// ----- Gap Adjustments -----
export const GAP_ADJUSTMENTS = {
	singleItem: 0,
	twoItems: 16,
	fewItems: 12,
	mediumItems: 10,
	manyItems: 8
};

// ----- Helper Functions -----

/**
 * Determines container aspect ratio
 */
export function getContainerAspect(width: number, height: number): ContainerAspect {
	if (!width || !height) return 'square';
	const ratio = width / height;
	if (ratio < ASPECT_RATIO.tall) return 'tall';
	if (ratio > ASPECT_RATIO.square) return 'wide';
	if (ratio < ASPECT_RATIO.widish) return 'widish';
	return 'square';
}

/**
 * Determines the device type based on container width and mobile status
 */
// src/lib/components/OptionPicker/config.ts (Updated function)
export function getDeviceType(width: number, isMobileUserAgent: boolean): DeviceType {
	// Prioritize User Agent for initial mobile/non-mobile split if needed,
	// but width is generally more reliable for layout.
	// You might adjust this logic based on how you want to define 'mobile' vs 'tablet' strictly.
	// This example uses width primarily.

	if (width < BREAKPOINTS.mobile) {
		// Use mobile breakpoint
		// Check smallMobile within mobile range if needed
		return width < BREAKPOINTS.smallMobile ? 'smallMobile' : 'mobile';
	}
	if (width < BREAKPOINTS.tablet) return 'mobile'; // Below tablet width is still mobile concept
	if (width < BREAKPOINTS.laptop) return 'tablet'; // Width between tablet and laptop
	if (width < BREAKPOINTS.desktop) return 'desktop';
	return 'largeDesktop';
}

// You might also want a simpler helper if you ONLY care about Mobile vs Tablet vs Desktop categories:
export function getSimplifiedDeviceCategory(width: number): 'mobile' | 'tablet' | 'desktop' {
	if (width < BREAKPOINTS.tablet) return 'mobile'; // Combines smallMobile and mobile
	if (width < BREAKPOINTS.laptop) return 'tablet';
	return 'desktop'; // Combines desktop and largeDesktop
}
/**
 * Gets the layout category based on item count
 */
export function getLayoutCategory(count: number): LayoutCategory {
	if (count === 1) return 'singleItem';
	if (count === 2) return 'twoItems';
	if (count <= 8) return 'fewItems';
	if (count <= 16) return 'mediumItems';
	if (count > 16) return 'manyItems';
	return 'manyItems';
}

/**
 * Gets the device config for a specific device type
 */
export function getDeviceConfig(deviceType: DeviceType) {
	return DEVICE_CONFIG[deviceType] || DEVICE_CONFIG.desktop;
}
