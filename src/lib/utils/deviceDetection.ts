/**
 * Enhanced foldable device detection utility
 * Provides comprehensive detection for foldable devices with a focus on Samsung Z Fold series
 */
export interface FoldableDetectionResult {
	isFoldable: boolean;
	isUnfolded: boolean;
	foldableType: 'zfold' | 'other' | 'unknown';
	confidence: number; // e.g., 0 to 1
	detectionMethod?: string; // How it was detected
}

export function detectFoldableDevice(): FoldableDetectionResult {
	const manualOverride = checkManualOverride();
	if (manualOverride) {
		if (DEBUG_MODE)
			console.log('--- detectFoldableDevice: Using Manual Override ---', manualOverride);
		return manualOverride;
	}

	let finalResult: FoldableDetectionResult = {
		isFoldable: false,
		isUnfolded: false,
		foldableType: 'unknown',
		confidence: 0,
		detectionMethod: 'none'
	};

	// --- Environment Info ---
	const ua = navigator.userAgent;
	const screenW = window.screen.width;
	const screenH = window.screen.height;
	const windowW = window.innerWidth;
	const windowH = window.innerHeight;
	const pixelRatio = window.devicePixelRatio;
	const aspectRatio = windowW / windowH;

	if (DEBUG_MODE) {
		/* ... keep logging ... */
	}

	// --- Detection Logic ---

	// 1. Prioritize Device Spec Check (using window dimensions)
	let specMatchFound = checkAgainstDeviceSpecs(ua, windowW, windowH, finalResult);

	// 2. If no spec match, try other methods (Segments, Spanning, UA, Generic Dimensions)
	if (!specMatchFound) {
		console.log('No spec match, trying other detection methods...');
		let detectedFoldable = false;
		let detectedUnfolded = false;
		let method = 'none';
		let conf = 0;

		// Check APIs first (more reliable than dimensions)
		const isScreenSpanning =
			window.matchMedia('(screen-spanning: single-fold-vertical)').matches ||
			window.matchMedia('(screen-spanning: single-fold-horizontal)').matches;
		let segmentCount = 0;
		// @ts-ignore
		if ('getWindowSegments' in navigator)
			try {
				if (typeof navigator.getWindowSegments === 'function') {
					segmentCount = navigator.getWindowSegments().length;
				}
			} catch (e) {}
		let viewportSegments: any[] | undefined;
		// @ts-ignore
		if (window.visualViewport && 'segments' in window.visualViewport)
			viewportSegments = window.visualViewport.segments as any[] | undefined;
		const hasSegments = segmentCount > 1 || (viewportSegments && viewportSegments.length > 1);

		if (isScreenSpanning || hasSegments) {
			detectedFoldable = true;
			conf = 0.8;
			method = isScreenSpanning
				? 'mediaQuery'
				: segmentCount > 1
					? 'getWindowSegments'
					: 'visualViewport';
			// Refined unfolded check based on segments/spanning might be needed here if available
			// For now, use dimension heuristic as fallback for unfolded state
			if (windowW > 600 && aspectRatio > 0.8 && aspectRatio < 1.3) {
				detectedUnfolded = true;
			} else {
				detectedUnfolded = false;
			}
		} else {
			// Fallback to Generic Dimension Heuristic (Less Reliable)
			console.log('No API match, trying generic dimension heuristic...');
			if (windowW > 600 && aspectRatio > 0.8 && aspectRatio < 1.3) {
				console.log('Generic dimension heuristic PASSED.');
				detectedFoldable = true;
				detectedUnfolded = true; // Assume unfolded if dimensions match
				conf = 0.6; // Lower confidence
				method = 'GenericDimensions';
			} else {
				console.log('Generic dimension heuristic FAILED.');
			}
		}

		// If detected by non-spec methods, update result
		if (detectedFoldable) {
			finalResult.isFoldable = true;
			finalResult.isUnfolded = detectedUnfolded;
			finalResult.confidence = conf;
			finalResult.detectionMethod = method;
			// Leave foldableType as 'unknown' unless we have a UA hint
			if (/galaxy z/i.test(ua)) {
				// Keep simple UA check for type hint
				finalResult.foldableType = 'zfold';
				console.log("UA hint suggests 'zfold' type.");
			} else {
				finalResult.foldableType = 'other'; // Or 'other' if detected but not zfold UA
				console.log("Detected foldable, but UA doesn't hint 'zfold', setting type to 'other'.");
			}
		}
	}

	// --- Log Final Output ---
	if (DEBUG_MODE) console.log('--- detectFoldableDevice RESULT ---', finalResult);

	saveDetectionResult(finalResult); // Save if confident enough
	return finalResult;
}
// Device specification configuration
const FOLDABLE_DEVICE_SPECS = {
	zfold3: {
		models: ['SM-F926'],
		foldedDimensions: {
			width: { min: 350, max: 400 },
			height: { min: 800, max: 900 }
		},
		unfoldedDimensions: {
			width: { min: 700, max: 800 },
			height: { min: 800, max: 900 }
		}
	},
	zfold4: {
		models: ['SM-F936'],
		foldedDimensions: {
			width: { min: 350, max: 400 },
			height: { min: 800, max: 900 }
		},
		unfoldedDimensions: {
			width: { min: 700, max: 800 },
			height: { min: 800, max: 900 }
		}
	},
	zfold5: {
		models: ['SM-F946'],
		foldedDimensions: {
			width: { min: 350, max: 400 },
			height: { min: 800, max: 900 }
		},
		unfoldedDimensions: {
			width: { min: 700, max: 820 },
			height: { min: 800, max: 920 }
		}
	},
	zfold6: {
		// Added Z Fold 6 Placeholder
		models: ['SM-F956'], 
		foldedDimensions: {
			// Estimate based on previous models
			width: { min: 350, max: 410 },
			height: { min: 800, max: 950 }
		},
		unfoldedDimensions: {
			// Adjust based on your logged 823x707
			width: { min: 800, max: 850 }, // e.g., covering 823
			height: { min: 680, max: 750 } // e.g., covering 707
		}
	}
};

// Enable debug mode through URL parameter
const DEBUG_MODE =
	typeof window !== 'undefined' && window.location.search.includes('debug=foldable');

/**
 * Check for manual device override
 */
function checkManualOverride(): FoldableDetectionResult | null {
	try {
		const override = localStorage.getItem('foldableDeviceOverride');
		if (override) {
			const settings = JSON.parse(override);
			return {
				isFoldable: settings.isFoldable,
				foldableType: settings.foldableType as 'zfold' | 'other' | 'unknown',
				isUnfolded: settings.isUnfolded,
				confidence: 1.0, // Max confidence for manual override
				detectionMethod: 'ManualOverride'
			};
		}
	} catch (e) {
		console.log('Error checking for manual override:', e);
	}
	return null;
}

/**
 * Save detection results for future reference
 */
function saveDetectionResult(result: FoldableDetectionResult) {
	if (!result.isFoldable || result.confidence < 0.6) return;

	try {
		const dataToSave = {
			...result,
			timestamp: Date.now(),
			width: window.innerWidth,
			height: window.innerHeight
		};
		localStorage.setItem('foldableDeviceState', JSON.stringify(dataToSave));
	} catch (e) {
		console.log('Error saving detection state:', e);
	}
}

/**
 * Get previous detection results
 */
function getLastDetectionResult(): any {
	try {
		const saved = localStorage.getItem('foldableDeviceState');
		if (saved) {
			const parsed = JSON.parse(saved);
			// Only use if detection was recent (within 1 day)
			if (Date.now() - parsed.timestamp < 86400000) {
				return parsed;
			}
		}
	} catch (e) {
		console.log('Error retrieving detection state:', e);
	}
	return null;
}

/**
 * Check against known device specifications
 */
function checkAgainstDeviceSpecs(
	ua: string,
	width: number, // Use window innerWidth/Height for matching unfolded state
	height: number,
	result: FoldableDetectionResult // Pass result by reference to modify it
): boolean {
	// Return true if a match was found and handled
	for (const [deviceKey, specs] of Object.entries(FOLDABLE_DEVICE_SPECS)) {
		const isMatchingModel = specs.models.some((model) => ua.includes(model));

		if (isMatchingModel) {
			console.log(`Device Spec Match: Found model match for ${deviceKey}`);
			result.isFoldable = true;
			// Assume 'zfold' if it matches any key starting with 'zfold'
			result.foldableType = deviceKey.startsWith('zfold') ? 'zfold' : 'other';
			result.confidence = 0.9; // High confidence for spec match
			result.detectionMethod = 'DeviceSpecMatch';

			// Check dimensions against UNFOLDED specs
			const { min: minWUnfolded, max: maxWUnfolded } = specs.unfoldedDimensions.width;
			const { min: minHUnfolded, max: maxHUnfolded } = specs.unfoldedDimensions.height;

			// Check both orientations (width/height might be swapped)
			const isUnfoldedMatch =
				(width >= minWUnfolded &&
					width <= maxWUnfolded &&
					height >= minHUnfolded &&
					height <= maxHUnfolded) ||
				(height >= minWUnfolded &&
					height <= maxWUnfolded &&
					width >= minHUnfolded &&
					width <= maxHUnfolded);

			if (isUnfoldedMatch) {
				console.log(`Device Spec Match: Dimensions match UNFOLDED state for ${deviceKey}`);
				result.isUnfolded = true;
			} else {
				// Optionally check against FOLDED dimensions here if needed
				console.log(
					`Device Spec Match: Dimensions DO NOT match unfolded state for ${deviceKey}. Assuming folded.`
				);
				result.isUnfolded = false;
			}
			return true; // Stop checking once a model matches
		}
	}
	console.log('Device Spec Match: No matching model found in specs.');
	return false; // No spec match found
}

/**
 * Register for posture change events
 */
function registerPostureChangeListener() {
	if ('devicePosture' in navigator) {
		try {
			const devicePosture = (navigator as any).devicePosture;

			devicePosture.addEventListener('change', () => {
				// Update detection when posture changes
				if (DEBUG_MODE) {
					console.log('Posture changed:', devicePosture.type);
				}

				// Could dispatch custom event or update a store here
				window.dispatchEvent(
					new CustomEvent('foldableDeviceChange', {
						detail: detectFoldableDevice()
					})
				);
			});
		} catch (e) {
			console.error('Error setting up posture change listener:', e);
		}
	}
}

/**
 * Utilities to be called from debug panel or settings
 */
export const FoldableDeviceUtils = {
	// Set manual override from debug panel
	setManualOverride(settings: {
		isFoldable: boolean;
		foldableType: 'zfold' | 'other' | 'unknown';
		isUnfolded: boolean;
	}) {
		localStorage.setItem('foldableDeviceOverride', JSON.stringify(settings));
	},

	// Clear manual override
	clearManualOverride() {
		localStorage.removeItem('foldableDeviceOverride');
	},

	// Force detection refresh
	refreshDetection() {
		return detectFoldableDevice();
	},

	// Get debug info
	getDebugInfo: () => {
		const currentDetection = detectFoldableDevice(); // Run detection
		const lastSavedDetection = null; // Or load if you save it
		const hasManualOverride = localStorage.getItem('foldableDeviceOverride') !== null;

		return {
			currentDetection,
			lastSavedDetection,
			hasManualOverride,
			windowDimensions: {
				width: window.innerWidth,
				height: window.innerHeight,
				pixelRatio: window.devicePixelRatio
			},
			screenDimensions: {
				width: window.screen.width,
				height: window.screen.height,
				availWidth: window.screen.availWidth,
				availHeight: window.screen.availHeight
			},
			userAgent: navigator.userAgent
			// Add results of specific checks if needed
			// mediaQuerySingleFoldV: window.matchMedia('(screen-spanning: single-fold-vertical)').matches,
			// mediaQuerySingleFoldH: window.matchMedia('(screen-spanning: single-fold-horizontal)').matches,
		};
	}
};
