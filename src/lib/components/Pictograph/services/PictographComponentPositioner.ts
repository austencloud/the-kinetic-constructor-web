import { get, type Writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import { PictographChecker } from '../PictographChecker';
import { ArrowPlacementManager } from '../../PlacementManagers/ArrowPlacementManager/ArrowPlacementManager';

type Location = 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw';

interface BasePosition {
	x: number;
	y: number;
}

export class PictographComponentPositioner {
	private readonly _basePositions: Record<Location, BasePosition> = {
		n: { x: 475, y: 330 },
		e: { x: 620, y: 475 },
		s: { x: 475, y: 620 },
		w: { x: 330, y: 475 },
		ne: { x: 620, y: 330 },
		se: { x: 620, y: 620 },
		sw: { x: 330, y: 620 },
		nw: { x: 330, y: 330 }
	};

	private _arrowPlacementManager: ArrowPlacementManager | null = null;

	constructor(private _pictographDataStore: Writable<PictographData>) {}

	/**
	 * Position a prop on the grid
	 * @param prop - Prop to be positioned
	 * @param gridData - Grid data for positioning
	 */
	positionProp(prop: PropData, gridData: GridData): void {
		const gridMode = get(this._pictographDataStore).gridMode;
		const pointName = `${prop.loc}_${gridMode}_hand_point`;

		prop.coords =
			gridData.allHandPointsNormal?.[pointName]?.coordinates ??
			this.getFallbackPropPosition(prop.loc);
	}

	/**
	 * Get fallback position for a prop
	 * @param loc - Location of the prop
	 * @returns Fallback coordinates
	 */
	private getFallbackPropPosition(loc?: string): BasePosition {
		const location = loc as Location;
		return location && this._basePositions[location]
			? this._basePositions[location]
			: { x: 475, y: 475 };
	}

	/**
	 * Position arrows on the grid
	 * @param redArrow - Red arrow to position
	 * @param blueArrow - Blue arrow to position
	 * @param gridData - Grid data for positioning
	 */
	positionArrows(redArrow: ArrowData, blueArrow: ArrowData, gridData: GridData): void {
		try {
			const manager = this.getArrowPlacementManager(gridData);
			manager.updateArrowPlacements([redArrow, blueArrow]);
		} catch {
			// Silently handle positioning errors
		}
	}

	/**
	 * Lazily create and cache arrow placement manager
	 * @param gridData - Grid data for placement
	 * @returns Arrow placement manager
	 */
	private getArrowPlacementManager(gridData: GridData): ArrowPlacementManager {
		if (!this._arrowPlacementManager) {
			const pictographData = get(this._pictographDataStore);
			const checker = new PictographChecker(pictographData);

			this._arrowPlacementManager = new ArrowPlacementManager(pictographData, gridData, checker);
		}
		return this._arrowPlacementManager;
	}
}
