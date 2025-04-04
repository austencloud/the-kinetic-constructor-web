// src/lib/components/OptionPicker/utils/deviceUtils.ts
export function isMobile(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= 768;
}

export function isPortrait(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerHeight > window.innerWidth;
}

export function detectDeviceState() {
	return {
		isMobileDevice: isMobile(),
		isPortraitMode: isPortrait()
	};
}
