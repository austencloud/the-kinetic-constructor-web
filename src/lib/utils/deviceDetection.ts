/**
 * Enhanced foldable device detection utility
 * Provides comprehensive detection for foldable devices with a focus on Samsung Z Fold series
 */

const FOLDABLE_DEVICE_SPECS = {
	zfold3: {
		models: ['SM-F926'],
		foldedDimensions: { width: { min: 350, max: 400 }, height: { min: 800, max: 900 } },
		unfoldedDimensions: { width: { min: 700, max: 800 }, height: { min: 800, max: 900 } }
	},
	zfold4: {
		models: ['SM-F936'],
		foldedDimensions: { width: { min: 350, max: 400 }, height: { min: 800, max: 900 } },
		unfoldedDimensions: { width: { min: 700, max: 800 }, height: { min: 800, max: 900 } }
	},
	zfold5: {
		models: ['SM-F946'],
		foldedDimensions: { width: { min: 350, max: 400 }, height: { min: 800, max: 900 } },
		unfoldedDimensions: { width: { min: 700, max: 820 }, height: { min: 800, max: 920 } }
	},
	zfold6: {
		models: ['SM-F956'],
		foldedDimensions: { width: { min: 350, max: 410 }, height: { min: 800, max: 950 } },
		unfoldedDimensions: { width: { min: 800, max: 850 }, height: { min: 680, max: 750 } }
	}
};

export interface FoldableDetectionResult {
	isFoldable: boolean;
	isUnfolded: boolean;
	foldableType: 'zfold' | 'other' | 'unknown';
	confidence: number;
	detectionMethod?: string;
}

export function detectFoldableDevice(): FoldableDetectionResult {
	const manualOverride = checkManualOverride();
	if (manualOverride) {
		return manualOverride;
	}

	const finalResult: FoldableDetectionResult = {
		isFoldable: false,
		isUnfolded: false,
		foldableType: 'unknown',
		confidence: 0,
		detectionMethod: 'none'
	};

	if (typeof window === 'undefined' || typeof navigator === 'undefined') {
		return finalResult;
	}

	const ua = navigator.userAgent;
	const windowW = window.innerWidth;
	const windowH = window.innerHeight;
	const pixelRatio = window.devicePixelRatio;
	const aspectRatio = windowW / windowH;

	const specMatchFound = checkAgainstDeviceSpecs(ua, windowW, windowH, finalResult);
	if (specMatchFound) {
		saveDetectionResult(finalResult);
		return finalResult;
	}

	const isScreenSpanning =
		window.matchMedia('(screen-spanning: single-fold-vertical)').matches ||
		window.matchMedia('(screen-spanning: single-fold-horizontal)').matches;
	let segmentCount = 0;
	try {
		// @ts-ignore - Experimental API
		if ('getWindowSegments' in navigator && typeof navigator.getWindowSegments === 'function') {
			// @ts-ignore
			segmentCount = navigator.getWindowSegments().length;
		}
	} catch {
		// Silent error handling
	}

	let viewportSegments: any[] | undefined;
	try {
		// @ts-ignore - Experimental API
		if (window.visualViewport && 'segments' in window.visualViewport) {
			// @ts-ignore
			viewportSegments = window.visualViewport.segments as any[] | undefined;
		}
	} catch (e) {
		// Silent error handling
	}

	const hasSegments = segmentCount > 1 || (viewportSegments && viewportSegments.length > 1);

	if (isScreenSpanning || hasSegments) {
		finalResult.isFoldable = true;
		finalResult.confidence = 0.8;
		finalResult.detectionMethod = isScreenSpanning
			? 'mediaQuery'
			: segmentCount > 1
				? 'getWindowSegments'
				: 'visualViewport';
		finalResult.isUnfolded = aspectRatio > 0.8 && aspectRatio < 1.3;
		finalResult.foldableType = /galaxy z/i.test(ua) ? 'zfold' : 'other';

		saveDetectionResult(finalResult);
		return finalResult;
	}

	const isLikelyDesktopUA =
		/Windows NT|Macintosh|Linux x86_64/i.test(ua) && !/Android|iPhone|iPad|iPod|Mobile/i.test(ua);
	if (isLikelyDesktopUA) {
		return finalResult;
	}

	if (windowW > 600 && aspectRatio > 0.8 && aspectRatio < 1.3 && pixelRatio > 1.5) {
		finalResult.isFoldable = true;
		finalResult.isUnfolded = true;
		finalResult.confidence = 0.5;
		finalResult.detectionMethod = 'GenericDimensionsPixelRatio';
		finalResult.foldableType = /galaxy z/i.test(ua) ? 'zfold' : 'other';
	}

	saveDetectionResult(finalResult);
	return finalResult;
}

function checkManualOverride(): FoldableDetectionResult | null {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
	try {
		const override = localStorage.getItem('foldableDeviceOverride');
		if (override) {
			const settings = JSON.parse(override);
			if (typeof settings.isFoldable === 'boolean' && typeof settings.isUnfolded === 'boolean') {
				return {
					isFoldable: settings.isFoldable,
					foldableType: settings.foldableType || 'unknown',
					isUnfolded: settings.isUnfolded,
					confidence: 1.0,
					detectionMethod: 'ManualOverride'
				};
			}
		}
	} catch {
		// Silent error handling
	}
	return null;
}

function saveDetectionResult(result: FoldableDetectionResult) {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
	if (!result.isFoldable || result.confidence < 0.6) return;

	try {
		const dataToSave = {
			...result,
			timestamp: Date.now(),
			width: window.innerWidth,
			height: window.innerHeight
		};
		localStorage.setItem('foldableDeviceState', JSON.stringify(dataToSave));
	} catch {
		// Silent error handling
	}
}

function checkAgainstDeviceSpecs(
	ua: string,
	width: number,
	height: number,
	result: FoldableDetectionResult
): boolean {
	for (const [deviceKey, specs] of Object.entries(FOLDABLE_DEVICE_SPECS)) {
		const isMatchingModel = specs.models.some((model) => ua.includes(model));

		if (isMatchingModel) {
			result.isFoldable = true;
			result.foldableType = deviceKey.startsWith('zfold') ? 'zfold' : 'other';
			result.confidence = 0.9;
			result.detectionMethod = 'DeviceSpecMatch';

			const { min: minWUnfolded, max: maxWUnfolded } = specs.unfoldedDimensions.width;
			const { min: minHUnfolded, max: maxHUnfolded } = specs.unfoldedDimensions.height;

			const isUnfoldedMatch =
				(width >= minWUnfolded &&
					width <= maxWUnfolded &&
					height >= minHUnfolded &&
					height <= maxHUnfolded) ||
				(height >= minWUnfolded &&
					height <= maxWUnfolded &&
					width >= minHUnfolded &&
					width <= maxHUnfolded);

			result.isUnfolded = isUnfoldedMatch;
			return true;
		}
	}
	return false;
}

export const FoldableDeviceUtils = {
	setManualOverride(settings: {
		isFoldable: boolean;
		foldableType: 'zfold' | 'other' | 'unknown';
		isUnfolded: boolean;
	}) {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('foldableDeviceOverride', JSON.stringify(settings));
		}
	},

	clearManualOverride() {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('foldableDeviceOverride');
		}
	},

	refreshDetection() {
		return detectFoldableDevice();
	},

	getDebugInfo: (): object => {
		if (typeof window === 'undefined' || typeof navigator === 'undefined') {
			return { error: 'Cannot get debug info outside browser environment.' };
		}
		const currentDetection = detectFoldableDevice();
		const hasManualOverride = localStorage.getItem('foldableDeviceOverride') !== null;
		let apiChecks = {};
		try {
			apiChecks = {
				isScreenSpanning:
					window.matchMedia('(screen-spanning: single-fold-vertical)').matches ||
					window.matchMedia('(screen-spanning: single-fold-horizontal)').matches,
				// @ts-ignore
				getWindowSegmentsLength:
					'getWindowSegments' in navigator && typeof navigator.getWindowSegments === 'function'
						? navigator.getWindowSegments().length
						: 'N/A',
				// @ts-ignore
				visualViewportSegmentsLength:
					window.visualViewport && 'segments' in window.visualViewport
						? (window.visualViewport.segments as any[])?.length
						: 'N/A'
			};
		} catch {
			// Silent error handling
		}

		return {
			currentDetection,
			hasManualOverride,
			windowDimensions: {
				width: window.innerWidth,
				height: window.innerHeight,
				pixelRatio: window.devicePixelRatio,
				aspectRatio: (window.innerWidth / window.innerHeight).toFixed(3)
			},
			screenDimensions: {
				width: window.screen.width,
				height: window.screen.height,
				availWidth: window.screen.availWidth,
				availHeight: window.screen.availHeight
			},
			userAgent: navigator.userAgent,
			apiChecks
		};
	}
};
