// src/lib/components/Pictograph/services/PictographComponentPositioner.ts
import { get, type Writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { GridData } from '$lib/components/objects/Grid/GridData';

/**
 * Service class responsible for positioning components on the pictograph
 */
export class PictographComponentPositioner {
	constructor(private pictographDataStore: Writable<PictographData>) {}

	/**
	 * Position a prop component using grid data
	 */
	positionProp(prop: PropData, gridData: GridData): void {
		const gridMode = get(this.pictographDataStore).gridMode;
		const pointName = `${prop.loc}_${gridMode}_hand_point`;

		if (gridData.allHandPointsNormal && gridData.allHandPointsNormal[pointName]?.coordinates) {
			// Use grid coordinates if available
			prop.coords = { ...gridData.allHandPointsNormal[pointName].coordinates! };
		} else {
			// Apply fallback positioning if grid point not found
			this.applyFallbackPropPosition(prop);
		}
	}

	/**
	 * Position an arrow component relative to its prop
	 */
	positionArrow(arrow: ArrowData, gridData: GridData, colorProp: PropData | null): void {
		if (colorProp && colorProp.coords) {
			// Position relative to the prop with appropriate offset
			arrow.coords = {
				x: colorProp.coords.x + (arrow.color === 'red' ? 30 : -30),
				y: colorProp.coords.y + 30
			};
		} else {
			// Fallback to center if prop not available
			arrow.coords = { x: 475, y: 475 };
		}
	}

	/**
	 * Apply fallback positioning when grid points aren't available
	 */
	private applyFallbackPropPosition(prop: PropData): void {
		const basePositions: Record<string, { x: number; y: number }> = {
			n: { x: 475, y: 330 },
			e: { x: 620, y: 475 },
			s: { x: 475, y: 620 },
			w: { x: 330, y: 475 },
			ne: { x: 620, y: 330 },
			se: { x: 620, y: 620 },
			sw: { x: 330, y: 620 },
			nw: { x: 330, y: 330 }
		};

		if (prop.loc && basePositions[prop.loc]) {
			prop.coords = { ...basePositions[prop.loc] };
		} else {
			prop.coords = { x: 475, y: 475 }; // Center as ultimate fallback
		}
	}
}
