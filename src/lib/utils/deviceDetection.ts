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
	if (isSamsung) {
		// Z-Fold dimensions when unfolded are typically:
		// Width: ~1000-1200px, height: ~800-900px, with high pixel ratio
		if (width > 900 && width < 1300 && height > 700 && height < 1000 && pixelRatio > 2) {
			result.isFoldable = true;
			result.isUnfolded = true;
			result.foldableType = 'zfold';
		}
		// Folded dimensions (more like a regular phone)
		else if (width > 350 && width < 500 && height > 800 && pixelRatio > 2) {
			result.isFoldable = true;
			result.isUnfolded = false;
			result.foldableType = 'zfold';
		}
	}

	return result;
}
