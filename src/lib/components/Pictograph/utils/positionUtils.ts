// src/lib/components/Pictograph/utils/positionUtils.ts

import type { PropData } from "$lib/components/objects/Prop/PropData";

/**
 * Base positions for each cardinal and intercardinal direction
 * These positions are used as the foundation for prop placement
 */
const BASE_POSITIONS: Record<string, { x: number; y: number }> = {
	n: { x: 475, y: 330 },
	e: { x: 620, y: 475 },
	s: { x: 475, y: 620 },
	w: { x: 330, y: 475 },
	ne: { x: 620, y: 330 },
	se: { x: 620, y: 620 },
	sw: { x: 330, y: 620 },
	nw: { x: 330, y: 330 }
};

/**
 * Color-specific offsets to avoid props overlapping
 * Red props are shifted slightly right, blue props slightly left
 */
const COLOR_OFFSETS: Record<string, { x: number; y: number }> = {
	red: { x: 30, y: 0 },
	blue: { x: -30, y: 0 }
};

/**
 * Default center position when all else fails
 */
const DEFAULT_CENTER = { x: 475, y: 475 };

/**
 * Apply fallback position for a prop when standard positioning fails
 *
 * This function follows a clear fallback chain:
 * 1. Try to position based on the prop's location + color offset
 * 2. If location is invalid, use center position + color offset
 *
 * @param prop - The prop data object to update with new coordinates
 * @param color - The color of the prop ('red' or 'blue')
 */
export function applyFallbackPosition(prop: PropData, color: string): void {
	// Get the color-specific offset (or use no offset if color is invalid)
	const offset = COLOR_OFFSETS[color] || { x: 0, y: 0 };

	// First attempt: Use the prop's location if valid
	if (prop.loc && BASE_POSITIONS[prop.loc]) {
		const base = BASE_POSITIONS[prop.loc];
		prop.coords = {
			x: base.x + offset.x,
			y: base.y + offset.y
		};
		return;
	}

	// Last resort: Center position with color offset
	prop.coords = {
		x: DEFAULT_CENTER.x + offset.x,
		y: DEFAULT_CENTER.y + offset.y
	};

	// Log that we had to use a fallback position
	console.warn(`Applied fallback position for ${color} prop. No valid location found.`);
}
