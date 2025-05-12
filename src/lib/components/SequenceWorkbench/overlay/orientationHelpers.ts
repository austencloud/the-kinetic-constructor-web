/**
 * Orientation Helpers
 *
 * This module provides utility functions for handling orientation detection and rotation
 * in the sequence overlay component.
 */

/**
 * Determines the natural orientation of the content based on rows and columns
 *
 * @param rows Number of rows in the grid
 * @param cols Number of columns in the grid
 * @returns 'landscape' if naturally wide, 'portrait' if naturally tall
 */
export function getContentOrientation(rows: number, cols: number): 'landscape' | 'portrait' {
	return cols > rows ? 'landscape' : 'portrait';
}

/**
 * Determines the device orientation based on viewport dimensions
 *
 * @param viewportWidth Width of the viewport
 * @param viewportHeight Height of the viewport
 * @returns 'landscape' if device is in landscape mode, 'portrait' if in portrait mode
 */
export function getDeviceOrientation(
	viewportWidth: number,
	viewportHeight: number
): 'landscape' | 'portrait' {
	// Check for screen orientation API first (more reliable on mobile)
	if (typeof window !== 'undefined' && window.screen && window.screen.orientation) {
		const orientation = window.screen.orientation.type;
		if (orientation.includes('portrait')) {
			return 'portrait';
		}
		if (orientation.includes('landscape')) {
			return 'landscape';
		}
	}

	// Check for window.orientation as fallback (deprecated but still works on some devices)
	if (typeof window !== 'undefined' && 'orientation' in window) {
		const orientation = window.orientation as number;
		if (orientation === 0 || orientation === 180) {
			return 'portrait';
		}
		if (orientation === 90 || orientation === -90) {
			return 'landscape';
		}
	}

	// Fallback to comparing dimensions
	return viewportWidth > viewportHeight ? 'landscape' : 'portrait';
}

/**
 * Determines if the grid should be rotated based on content and device orientations
 *
 * @param contentOrientation Natural orientation of the content
 * @param deviceOrientation Current orientation of the device
 * @returns True if the grid should be rotated, false otherwise
 */
export function shouldRotateGrid(
	contentOrientation: 'landscape' | 'portrait',
	deviceOrientation: 'landscape' | 'portrait'
): boolean {
	return contentOrientation !== deviceOrientation;
}

/**
 * Calculates the pictograph size in both orientations to determine which is better
 *
 * @param rows Number of rows in the grid
 * @param cols Number of columns in the grid
 * @param containerWidth Width of the container
 * @param containerHeight Height of the container
 * @param viewportWidth Width of the viewport
 * @param viewportHeight Height of the viewport
 * @returns Object with size information and rotation recommendation
 */
export function calculateOrientationSizes(
	rows: number,
	cols: number,
	containerWidth: number,
	containerHeight: number,
	viewportWidth: number,
	viewportHeight: number
): {
	normalSize: number;
	rotatedSize: number;
	shouldRotate: boolean;
	suggestRotation: boolean;
	gridWidth: number;
	gridHeight: number;
	rotatedGridWidth: number;
	rotatedGridHeight: number;
	normalScale: number;
	rotatedScale: number;
} {
	// Be extremely conservative with viewport dimensions to ensure no overflow
	// Use 90% of viewport width and 85% of viewport height to ensure content fits
	const maxWidth = Math.min(containerWidth, viewportWidth * 0.9);
	const maxHeight = Math.min(containerHeight, viewportHeight * 0.85); // Leave room for rotation indicator

	// Calculate the maximum possible cell size in normal orientation
	const maxNormalCellWidth = maxWidth / cols;
	const maxNormalCellHeight = maxHeight / rows;
	const normalSize = Math.min(maxNormalCellWidth, maxNormalCellHeight);

	// Calculate grid dimensions in normal orientation
	const gridWidth = normalSize * cols;
	const gridHeight = normalSize * rows;

	// Calculate the maximum possible cell size in rotated orientation
	const maxRotatedCellWidth = maxWidth / rows;
	const maxRotatedCellHeight = maxHeight / cols;
	const rotatedSize = Math.min(maxRotatedCellWidth, maxRotatedCellHeight);

	// Calculate grid dimensions in rotated orientation
	const rotatedGridWidth = rotatedSize * rows;
	const rotatedGridHeight = rotatedSize * cols;

	// Calculate scale factors if needed
	const normalScale = Math.min(
		maxWidth / (normalSize * cols),
		maxHeight / (normalSize * rows),
		1 // Cap at 1 to prevent enlarging
	);

	const rotatedScale = Math.min(
		maxWidth / (rotatedSize * rows),
		maxHeight / (rotatedSize * cols),
		1 // Cap at 1 to prevent enlarging
	);

	// Determine if rotation would result in larger pictographs
	// Consider the scale factors in the comparison
	const effectiveNormalSize = normalSize * normalScale;
	const effectiveRotatedSize = rotatedSize * rotatedScale;
	const sizeImprovement = effectiveRotatedSize / effectiveNormalSize;

	// Check for mobile devices with unusual aspect ratios
	const isMobile =
		typeof window !== 'undefined' &&
		('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);

	const isNarrowScreen =
		typeof window !== 'undefined' && window.innerWidth < 500 && window.innerHeight > 700;

	// Determine if we should rotate based on size improvement and device characteristics
	const shouldRotate = sizeImprovement > 1.1 || (isMobile && isNarrowScreen && rows < cols);

	// Suggest rotation to the user (but don't force it) if it would be beneficial
	// Be more aggressive with the suggestion on mobile devices
	const suggestRotation = sizeImprovement > 1.1 || (isMobile && isNarrowScreen && rows < cols);

	return {
		normalSize,
		rotatedSize,
		shouldRotate,
		suggestRotation,
		gridWidth,
		gridHeight,
		rotatedGridWidth,
		rotatedGridHeight,
		normalScale,
		rotatedScale
	};
}

/**
 * Generates CSS transform for grid rotation
 *
 * @param shouldRotate Whether the grid should be rotated
 * @returns CSS transform string
 */
export function getRotationTransform(shouldRotate: boolean): string {
	return shouldRotate ? 'rotate(90deg)' : 'none';
}

/**
 * Calculates the dimensions for the rotated grid container
 *
 * @param shouldRotate Whether the grid should be rotated
 * @param gridWidth Original grid width
 * @param gridHeight Original grid height
 * @param rotatedGridWidth Width when rotated
 * @param rotatedGridHeight Height when rotated
 * @param viewportWidth Width of the viewport
 * @param viewportHeight Height of the viewport
 * @param normalScale Scale factor for normal orientation
 * @param rotatedScale Scale factor for rotated orientation
 * @returns Object with width, height, scale and transform for the container
 */
export function getRotatedContainerDimensions(
	shouldRotate: boolean,
	gridWidth: number,
	gridHeight: number,
	rotatedGridWidth: number,
	rotatedGridHeight: number,
	viewportWidth: number,
	viewportHeight: number,
	normalScale: number = 1,
	rotatedScale: number = 1
): { width: string; height: string; scale: number; transform: string } {
	// Use a higher percentage of viewport dimensions to maximize space usage
	// while still ensuring no overflow
	const maxWidth = viewportWidth * 0.95;
	const maxHeight = viewportHeight * 0.9; // Leave room for rotation indicator

	let width: number;
	let height: number;
	let scale: number;

	if (shouldRotate) {
		// When rotated, use rotated dimensions and scale
		width = rotatedGridWidth;
		height = rotatedGridHeight;
		scale = rotatedScale;

		// Ensure dimensions don't exceed viewport
		if (width > maxWidth || height > maxHeight) {
			const constraintScale = Math.min(maxWidth / width, maxHeight / height);
			scale = Math.min(scale, constraintScale);
		}
	} else {
		// No rotation, use original dimensions and scale
		width = gridWidth;
		height = gridHeight;
		scale = normalScale;

		// Ensure dimensions don't exceed viewport
		if (width > maxWidth || height > maxHeight) {
			const constraintScale = Math.min(maxWidth / width, maxHeight / height);
			scale = Math.min(scale, constraintScale);
		}
	}

	// Apply a minimal safety factor to prevent overflow while maximizing space
	// This is especially important for devices with unusual aspect ratios
	scale = scale * 0.98;

	// Get the appropriate transform
	const transform = shouldRotate ? 'rotate(90deg)' : 'none';

	return {
		width: `${width}px`,
		height: `${height}px`,
		scale,
		transform
	};
}

/**
 * Generates a message suggesting device rotation based on content and device orientations
 *
 * @param contentOrientation Natural orientation of the content
 * @param deviceOrientation Current orientation of the device
 * @param suggestRotation Whether to suggest rotation based on size improvement
 * @returns Message suggesting device rotation, or null if no rotation is needed
 */
export function getRotationMessage(
	contentOrientation: 'landscape' | 'portrait',
	deviceOrientation: 'landscape' | 'portrait',
	suggestRotation: boolean
): string | null {
	// Special case for mobile devices with unusual aspect ratios
	const isMobile =
		typeof window !== 'undefined' &&
		('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);

	const isNarrowScreen =
		typeof window !== 'undefined' && window.innerWidth < 500 && window.innerHeight > 700;

	// Always suggest rotation on narrow mobile screens when content is landscape
	if (
		isMobile &&
		isNarrowScreen &&
		contentOrientation === 'landscape' &&
		deviceOrientation === 'portrait'
	) {
		return 'Rotate to landscape for optimal view';
	}

	// For other cases, only suggest rotation if it would be beneficial
	if (!suggestRotation || contentOrientation === deviceOrientation) {
		return null;
	}

	return deviceOrientation === 'portrait'
		? 'Rotate to landscape for optimal view'
		: 'Rotate to portrait for optimal view';
}
