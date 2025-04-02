import type { Dimensions, GradientStop } from '../../types/types';

/**
 * Draw a gradient background on the canvas
 * @param ctx Canvas rendering context
 * @param dimensions Canvas dimensions
 * @param gradientStops Gradient color stops
 */
export function drawBackgroundGradient(
	ctx: CanvasRenderingContext2D,
	dimensions: Dimensions,
	gradientStops: GradientStop[]
): void {
	const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height);

	// Add color stops
	gradientStops.forEach((stop) => {
		gradient.addColorStop(stop.position, stop.color);
	});

	// Fill with gradient
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, dimensions.width, dimensions.height);
}

/**
 * Adjust particles count based on dimensions and quality
 * @param currentCount Current number of particles
 * @param dimensions Canvas dimensions
 * @param baseDensity Base density factor
 * @param quality Quality level
 * @returns Target number of particles
 */
export function calculateParticleCount(
	dimensions: Dimensions,
	baseDensity: number,
	quality: 'high' | 'medium' | 'low'
): number {
	// Adjust density based on quality
	let adjustedDensity = baseDensity;

	// Scale density based on screen size for better performance on smaller devices
	const screenSizeFactor = Math.min(1, (dimensions.width * dimensions.height) / (1920 * 1080));
	adjustedDensity *= screenSizeFactor;

	// Adjust for quality setting
	if (quality === 'low') {
		adjustedDensity *= 0.5;
	} else if (quality === 'medium') {
		adjustedDensity *= 0.75;
	}

	return Math.floor(dimensions.width * dimensions.height * adjustedDensity);
}

/**
 * Determine if seasonal features should be enabled
 * @returns Boolean indicating whether seasonal features are active
 */
export function shouldEnableSeasonalFeatures(): boolean {
	const date = new Date();
	const month = date.getMonth();
	const day = date.getDate();

	// December or first week of January
	return month === 11 || (month === 0 && day <= 7);
}
