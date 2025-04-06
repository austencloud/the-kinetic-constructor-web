// src/lib/components/OptionPicker/utils/layoutConfig/configService.ts
import { BREAKPOINTS } from './breakpoints';
import { DEVICE_CONFIG } from './deviceConfigs';
import { LAYOUT_TEMPLATES } from './layoutTemplates';
import { GAP_ADJUSTMENTS } from './gapAdjustments';
import type { LayoutCategory, ContainerAspect } from './types';

type DeviceType = keyof typeof DEVICE_CONFIG;

export class LayoutConfigService {
	static getDeviceType(width: number, isMobileDevice: boolean): DeviceType {
		if (isMobileDevice) {
			return width < BREAKPOINTS.smallMobile ? 'smallMobile' : 'mobile';
		}

		if (width < BREAKPOINTS.tablet) return 'mobile';
		if (width < BREAKPOINTS.laptop) return 'tablet';
		return 'desktop';
	}

	static getLayoutCategory(count: number): LayoutCategory {
		if (count === 1) return 'singleItem';
		if (count === 2) return 'twoItems';
		if (count <= 6) return 'fewItems';
		if (count <= 12) return 'mediumItems';
		return 'manyItems';
	}

	static getContainerAspect(width: number, height: number): ContainerAspect {
		if (!width || !height) return 'square';

		const ratio = width / height;

		if (ratio < 0.8) return 'tall';
		if (ratio > 1.3) return 'wide';
		return 'square';
	}

	static getDeviceConfig(deviceType: DeviceType) {
		return DEVICE_CONFIG[deviceType];
	}

	static getLayoutTemplate(
		category: LayoutCategory,
		orientation: 'portraitDevice' | 'landscapeDevice'
	) {
		return (LAYOUT_TEMPLATES[category] as Record<'portraitDevice' | 'landscapeDevice', any>)[
			orientation
		];
	}

	static getGapAdjustment(category: LayoutCategory) {
		return GAP_ADJUSTMENTS[category] || 0;
	}
}
