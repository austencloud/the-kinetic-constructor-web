// src/lib/utils/deviceDetection.ts
export function detectFoldableDevice(): {
	isFoldable: boolean;
	isUnfolded: boolean;
	foldableType: 'unknown' | 'zfold' | 'other';
} {
	const result = {
		isFoldable: false,
		isUnfolded: false,
		foldableType: 'unknown' as 'unknown' | 'zfold' | 'other'
	};

	if (typeof window === 'undefined') return result;

	const ua = navigator.userAgent;
	const width = window.innerWidth;
	const height = window.innerHeight;
	const pixelRatio = window.devicePixelRatio || 1;

	// Samsung Galaxy Z Fold characteristics
	const isSamsung = /Samsung|SM-F|Galaxy Fold/i.test(ua);

	// Z-Fold specific detection
	// In deviceDetection.ts, update the detection ranges:
	// Z-Fold specific detection
	if (isSamsung) {
		// Adjust for your actual dimensions - these appear to be smaller than expected
		if (width > 350 && width < 600 && height > 450 && height < 600 && pixelRatio > 2) {
			result.isFoldable = true;
			result.isUnfolded = true;
			result.foldableType = 'zfold';
		}
		// Keep the folded detection logic
		else if (width > 350 && width < 500 && height > 800 && pixelRatio > 2) {
			result.isFoldable = true;
			result.isUnfolded = false;
			result.foldableType = 'zfold';
		}
	}

	return result;
}
