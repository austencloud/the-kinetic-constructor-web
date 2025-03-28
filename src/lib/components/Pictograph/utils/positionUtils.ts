// src/lib/components/Pictograph/utils/positionUtils.ts
import type { PropData } from '$lib/components/objects/Prop/PropData';

/**
 * Apply fallback position for a prop when standard positioning fails
 */
export function applyFallbackPosition(prop: PropData, color: string): void {
	// Apply strong fallback positions based on prop location
	const fallbacks: Record<string, { x: number; y: number }> = {
		n: { x: 475, y: 330 },
		e: { x: 620, y: 475 },
		s: { x: 475, y: 620 },
		w: { x: 330, y: 475 },
		ne: { x: 620, y: 330 },
		se: { x: 620, y: 620 },
		sw: { x: 330, y: 620 },
		nw: { x: 330, y: 330 }
	};

	// Apply more spread out positions for red vs blue
	const offset = color === 'red' ? 30 : -30;

	if (prop.loc && fallbacks[prop.loc]) {
		prop.coords = {
			x: fallbacks[prop.loc].x,
			y: fallbacks[prop.loc].y
		};
	} else {
		// Last resort center position with offset
		prop.coords = {
			x: 475 + offset,
			y: 475
		};
	}
}
