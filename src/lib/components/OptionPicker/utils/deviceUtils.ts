// src/lib/components/OptionPicker/utils/deviceUtils.ts
import { BREAKPOINTS } from './layoutConfig/breakpoints';

export type DeviceType = 'smallMobile' | 'mobile' | 'tablet' | 'desktop' | 'largeDesktop';

export function getDeviceType(width: number): DeviceType {
	if (width < BREAKPOINTS.smallMobile) return 'smallMobile';
	if (width < BREAKPOINTS.mobile) return 'mobile';
	if (width < BREAKPOINTS.tablet) return 'tablet';
	if (width < BREAKPOINTS.desktop) return 'desktop';
	return 'largeDesktop';
}

export function isMobile(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= BREAKPOINTS.mobile;
}

export function isPortrait(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerHeight > window.innerWidth;
}

export function detectDeviceState() {
	if (typeof window === 'undefined')
		return {
			isMobileDevice: false,
			isPortraitMode: false,
			deviceType: 'desktop' as DeviceType
		};

	const width = window.innerWidth;
	const deviceType = getDeviceType(width);

	return {
		isMobileDevice: width <= BREAKPOINTS.mobile,
		isPortraitMode: isPortrait(),
		deviceType
	};
}
