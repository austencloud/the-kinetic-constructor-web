/**
 * Enhanced foldable device detection utility
 * Provides comprehensive detection for foldable devices with a focus on Samsung Z Fold series
 */
interface FoldableDetectionResult {
	isFoldable: boolean;
	isUnfolded: boolean;
	foldableType: 'unknown' | 'zfold' | 'other';
	confidence: number; // 0.0-1.0 confidence level
	detectionMethod?: string; // Which method succeeded
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
	}
};

// Enable debug mode through URL parameter
const DEBUG_MODE =
	typeof window !== 'undefined' && window.location.search.includes('debug=foldable');

/**
 * Main detection function for foldable devices
 * Implements multiple detection methods with fallbacks
 */
export function detectFoldableDevice(): FoldableDetectionResult {
	const result: FoldableDetectionResult = {
		isFoldable: false,
		isUnfolded: false,
		foldableType: 'unknown',
		confidence: 0
	};

	if (typeof window === 'undefined') return result;

	// Check for debug mode
	if (DEBUG_MODE) {
		console.group('Foldable Device Detection Debug');
		console.time('detection-total');
	}

	// Check for manual override first
	const override = checkManualOverride();
	if (override) {
		if (DEBUG_MODE) {
			console.log('Using manual override:', override);
			console.timeEnd('detection-total');
			console.groupEnd();
		}
		return override;
	}

	// Get core device information
	const ua = navigator.userAgent;
	const width = window.innerWidth;
	const height = window.innerHeight;
	const pixelRatio = window.devicePixelRatio || 1;
	const aspectRatio = width / height;
	const pixelCount = width * height;

	if (DEBUG_MODE) {
		console.log('Device Information:', {
			ua,
			dimensions: { width, height, aspectRatio, pixelRatio, pixelCount },
			screen: {
				width: window.screen.width,
				height: window.screen.height,
				availWidth: window.screen.availWidth,
				availHeight: window.screen.availHeight
			}
		});
	}

	// Try Device Posture API (most reliable but limited support)
	if ('devicePosture' in navigator) {
		try {
			const devicePosture = (navigator as any).devicePosture;
			const posture = devicePosture.type;

			if (DEBUG_MODE) {
				console.log('Device Posture API:', { available: true, posture });
			}

			if (posture === 'folded' || posture === 'half-folded') {
				result.isFoldable = true;
				result.isUnfolded = posture === 'folded';
				result.foldableType = 'zfold';
				result.confidence = 0.95;
				result.detectionMethod = 'DevicePostureAPI';

				// Register for future posture changes
				registerPostureChangeListener();

				if (DEBUG_MODE) {
					console.log('Detected foldable via Device Posture API', result);
					console.timeEnd('detection-total');
					console.groupEnd();
				}

				return result;
			}
		} catch (e) {
			if (DEBUG_MODE) {
				console.log('Device Posture API error:', e);
			}
		}
	} else if (DEBUG_MODE) {
		console.log('Device Posture API not available');
	}

	// Try Viewport Segments API (good reliability)
	if (window.visualViewport && 'segments' in window.visualViewport) {
		try {
			const segments = (window.visualViewport as any).segments;

			if (DEBUG_MODE) {
				console.log('Viewport Segments API:', {
					available: true,
					segments: segments ? segments.length : 0
				});
			}

			if (segments && segments.length > 1) {
				result.isFoldable = true;
				result.isUnfolded = true;

				// Analyze segment layout to determine device type
				const segmentWidths = segments.map((segment: any) => segment.width);
				const segmentHeights = segments.map((segment: any) => segment.height);

				// Z-Fold typically has segments with similar dimensions
				const hasEqualSizedSegments = segmentWidths.every(
					(w: number) => Math.abs(w - segmentWidths[0]) < 100
				);

				result.foldableType = hasEqualSizedSegments ? 'zfold' : 'other';
				result.confidence = 0.9;
				result.detectionMethod = 'ViewportSegmentsAPI';

				if (DEBUG_MODE) {
					console.log('Detected foldable via Viewport Segments API', {
						result,
						segmentDetails: {
							widths: segmentWidths,
							heights: segmentHeights
						}
					});
					console.timeEnd('detection-total');
					console.groupEnd();
				}

				return result;
			}
		} catch (e) {
			if (DEBUG_MODE) {
				console.log('Viewport Segments API error:', e);
			}
		}
	} else if (DEBUG_MODE) {
		console.log('Viewport Segments API not available');
	}

	// Try CSS Environment Variables (experimental)
	if (window.CSS && typeof window.CSS.supports === 'function') {
		const hasFoldEnvironment = CSS.supports('(environment-variable: viewport-segment-width)');

		if (DEBUG_MODE) {
			console.log('CSS Environment Variables:', {
				available: hasFoldEnvironment
			});
		}

		if (hasFoldEnvironment) {
			result.isFoldable = true;
			result.confidence = 0.8;
			result.detectionMethod = 'CSSEnvironmentVariables';

			// Specific state still needs to be determined by dimensions
			// Will be handled in the dimension checks below
		}
	} else if (DEBUG_MODE) {
		console.log('CSS Environment Variables API not available');
	}

	// Model-based detection from User Agent
	const isZFold = /SM-F9\d\d/i.test(ua);
	const isZFlip = /SM-F7\d\d/i.test(ua);
	const isSurfaceDuo = /Surface Duo/i.test(ua);
	const isHuaweiMateX = /Mate X/i.test(ua);
	const isXiaomiMixFold = /Mix Fold/i.test(ua);
	const isSamsung = /Samsung|Galaxy/i.test(ua);

	if (DEBUG_MODE) {
		console.log('User Agent Detection:', {
			isZFold,
			isZFlip,
			isSurfaceDuo,
			isHuaweiMateX,
			isXiaomiMixFold,
			isSamsung
		});
	}

	// Check against device specs
	if (checkAgainstDeviceSpecs(ua, width, height, result)) {
		// Results already updated in the function
		saveDetectionResult(result);

		if (DEBUG_MODE) {
			console.log('Detected via device specs match', result);
			console.timeEnd('detection-total');
			console.groupEnd();
		}

		return result;
	}

	// Dimension-based detection if we have high-confidence device type
	if (isZFold) {
		result.isFoldable = true;
		result.foldableType = 'zfold';
		result.confidence = 0.85;
		result.detectionMethod = 'UserAgent+Dimensions';

		// Determine folded state via dimensions
		if (
			(width > 700 && width < 950 && height > 500 && height < 850) ||
			(height > 700 && height < 950 && width > 500 && width < 850)
		) {
			// Unfolded state - larger dimensions
			result.isUnfolded = true;
		} else {
			// Folded state - typical smartphone dimensions
			result.isUnfolded = false;
		}

		saveDetectionResult(result);

		if (DEBUG_MODE) {
			console.log('Detected Z-Fold via UA + dimensions', result);
			console.timeEnd('detection-total');
			console.groupEnd();
		}

		return result;
	}

	// Samsung device with specific dimensions that match Z Fold patterns
	if (isSamsung) {
		if (aspectRatio > 0.7 && aspectRatio < 1.3 && pixelCount > 600000) {
			// Square-ish aspect ratio with large screen area
			result.isFoldable = true;
			result.isUnfolded = true;
			result.foldableType = 'zfold';
			result.confidence = 0.75;
			result.detectionMethod = 'SamsungDimensions';

			if (DEBUG_MODE) {
				console.log('Detected likely Z-Fold via Samsung + dimensions', result);
				console.timeEnd('detection-total');
				console.groupEnd();
			}

			saveDetectionResult(result);
			return result;
		}
	}

	// Fallback for other foldable types
	if (isZFlip || isSurfaceDuo || isHuaweiMateX || isXiaomiMixFold) {
		result.isFoldable = true;
		result.foldableType = 'other';
		result.confidence = 0.8;
		result.detectionMethod = 'OtherFoldableUA';

		// Determine state based on dimensions
		// This is device-specific and would need tailored logic per device type
		// Implemented generically here

		saveDetectionResult(result);

		if (DEBUG_MODE) {
			console.log('Detected other foldable type', result);
			console.timeEnd('detection-total');
			console.groupEnd();
		}

		return result;
	}

	// General dimension check for unknown potential foldables
	if (
		width > 700 &&
		width < 900 &&
		height > 700 &&
		height < 900 &&
		Math.abs(width / height - 1) < 0.3
	) {
		// Square-ish large display that isn't a typical tablet ratio
		result.isFoldable = true;
		result.isUnfolded = true;
		result.confidence = 0.6;
		result.detectionMethod = 'GenericDimensions';

		if (DEBUG_MODE) {
			console.log('Detected potential foldable via dimensions', result);
		}
	}

	// Try using previous detection data
	const lastDetection = getLastDetectionResult();
	if (lastDetection && !result.isFoldable) {
		// If we've detected a foldable before but failed now, use the previous detection
		// with lower confidence, but only if dimensions are within reasonable range

		if (
			Math.abs(width / lastDetection.width - 1) < 0.2 &&
			Math.abs(height / lastDetection.height - 1) < 0.2
		) {
			result.isFoldable = lastDetection.isFoldable;
			result.isUnfolded = lastDetection.isUnfolded;
			result.foldableType = lastDetection.foldableType;
			result.confidence = Math.max(0.4, lastDetection.confidence * 0.7); // Reduced confidence
			result.detectionMethod = 'PreviousDetection';

			if (DEBUG_MODE) {
				console.log('Using previous detection data with reduced confidence', result);
			}
		}
	}

	if (DEBUG_MODE) {
		console.log('Final detection result', result);
		console.timeEnd('detection-total');
		console.groupEnd();
	}

	saveDetectionResult(result);
	return result;
}

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
	width: number,
	height: number,
	result: FoldableDetectionResult
): boolean {
	for (const [deviceType, specs] of Object.entries(FOLDABLE_DEVICE_SPECS)) {
		// Check against model number in UA
		const isMatchingModel = specs.models.some((model) => ua.includes(model));

		if (isMatchingModel) {
			result.isFoldable = true;
			result.foldableType = 'zfold';
			result.confidence = 0.9;
			result.detectionMethod = 'DeviceSpecMatch';

			// Check dimensions to determine if unfolded
			const { min: minW, max: maxW } = specs.unfoldedDimensions.width;
			const { min: minH, max: maxH } = specs.unfoldedDimensions.height;

			if (
				(width >= minW && width <= maxW && height >= minH && height <= maxH) ||
				(height >= minW && height <= maxW && width >= minH && width <= maxH)
			) {
				result.isUnfolded = true;
			} else {
				result.isUnfolded = false;
			}

			return true;
		}
	}
	return false;
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
	getDebugInfo() {
		const detection = detectFoldableDevice();
		const lastSaved = getLastDetectionResult();

		return {
			currentDetection: detection,
			lastSavedDetection: lastSaved,
			hasManualOverride: checkManualOverride() !== null,
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
		};
	}
};
