// src/lib/components/OptionPicker/utils/layoutConfig.ts
import type { DeviceType, LayoutCategory, ContainerAspect } from './layoutConfig/types';

/**
 * Unified configuration for responsive layouts in the OptionPicker
 * This consolidates what was previously spread across multiple files
 */
export const LAYOUT_CONFIG = {
	/**
	 * Breakpoints for different device sizes
	 * Used to determine device type and layout strategies
	 */
	breakpoints: {
		smallMobile: 375, // Smallest mobile devices (e.g., iPhone SE)
		mobile: 480, // Standard mobile devices
		tablet: 768, // Tablets and smaller laptops
		laptop: 1024, // Standard laptops
		desktop: 1280, // Desktop screens
		largeDesktop: 1600 // Large desktop screens
	},

	/**
	 * Aspect ratio thresholds for determining container shape
	 */
	aspectThresholds: {
		tall: 0.8, // Height is much greater than width
		square: 1.3, // Roughly square or close to square
		wide: 2.0 // Width is significantly greater than height
	},

	/**
	 * Device-specific configuration settings
	 * Controls padding, sizing, and scaling for different device types
	 */
	devices: {
		smallMobile: {
			padding: { horizontal: 8, vertical: 8 },
			gap: 2,
			minItemSize: 60,
			maxItemSize: 90,
			scaleFactor: 0.95
		},
		mobile: {
			padding: { horizontal: 12, vertical: 12 },
			gap: 8,
			minItemSize: 80,
			maxItemSize: 175,
			scaleFactor: 1
		},
		tablet: {
			padding: { horizontal: 16, vertical: 16 },
			gap: 12,
			minItemSize: 80,
			maxItemSize: 175,
			scaleFactor: 1
		},
		desktop: {
			padding: { horizontal: 20, vertical: 20 },
			gap: 16,
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
	},

	/**
	 * Gap size adjustments based on layout category
	 * These are added to the base gap sizes from device config
	 */
	gapAdjustments: {
		singleItem: 0,
		twoItems: 16,
		fewItems: 12,
		mediumItems: 10,
		manyItems: 8
	},

	/**
	 * Layout templates for different item counts and orientations
	 */
	templates: {
		singleItem: {
			cols: 1,
			class: 'single-item-grid'
		},
		twoItems: {
			horizontal: {
				cols: 2,
				class: 'two-item-grid horizontal-layout'
			},
			vertical: {
				cols: 1,
				class: 'two-item-grid vertical-layout'
			}
		},
		fewItems: {
			portraitDevice: {
				cols: 2,
				class: 'few-items-grid'
			},
			landscapeDevice: {
				cols: 3,
				class: 'few-items-grid'
			}
		},
		mediumItems: {
			portraitDevice: {
				cols: 3,
				class: 'medium-items-grid'
			},
			landscapeDevice: {
				cols: 4,
				class: 'medium-items-grid'
			}
		},
		manyItems: {
			portraitDevice: {
				cols: 3,
				class: 'many-items-grid'
			},
			landscapeDevice: {
				cols: 5,
				class: 'many-items-grid'
			}
		}
	}
};

/**
 * Helper function to determine container aspect ratio
 * @param width Container width
 * @param height Container height
 * @returns 'wide', 'square', or 'tall'
 */
export function getContainerAspect(width: number, height: number): ContainerAspect {
	if (!width || !height) return 'square';

	const ratio = width / height;
	const { tall, square } = LAYOUT_CONFIG.aspectThresholds;

	if (ratio < tall) return 'tall';
	if (ratio > square) return 'wide';
	return 'square';
}

/**
 * Determine device type based on container width and mobile state
 * @param width Container width
 * @param isMobileDevice Whether the device is considered mobile
 * @returns DeviceType classification
 */
export function getDeviceType(width: number, isMobileDevice: boolean): DeviceType {
	const { breakpoints } = LAYOUT_CONFIG;

	// Mobile devices
	if (isMobileDevice) {
		return width < breakpoints.smallMobile ? 'smallMobile' : 'mobile';
	}

	// Determine by screen size for non-mobile
	if (width < breakpoints.tablet) return 'mobile';
	if (width < breakpoints.desktop) return 'tablet';
	if (width < breakpoints.largeDesktop) return 'desktop';
	return 'largeDesktop';
}

/**
 * Get layout category based on item count
 * @param count Number of items to display
 * @returns Layout category classification
 */
export function getLayoutCategory(count: number): LayoutCategory {
	if (count === 1) return 'singleItem';
	if (count === 2) return 'twoItems';
	if (count <= 6) return 'fewItems';
	if (count <= 12) return 'mediumItems';
	return 'manyItems';
}

/**
 * Get the device config object
 * Falls back to desktop config if requested type not found
 * @param deviceType Type of device
 * @returns Device configuration object
 */
export function getDeviceConfig(deviceType: DeviceType) {
	return LAYOUT_CONFIG.devices[deviceType] || LAYOUT_CONFIG.devices.desktop;
}
