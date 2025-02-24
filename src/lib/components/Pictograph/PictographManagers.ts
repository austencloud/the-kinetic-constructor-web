// src/lib/components/Pictograph/PictographManagers.ts
import { PictographChecker } from './PictographChecker';
import { PictographGetter } from './PictographGetter';
import { PropPlacementManager } from '../PlacementManagers/PropPlacementManager/PropPlacementManager';
import { ArrowPlacementManager } from '../PlacementManagers/ArrowPlacementManager/ArrowPlacementManager';
import SvgManager from '../SvgManager/SvgManager';
import type { PictographData } from '$lib/types/PictographData';

export class PictographManagers {
	checker: PictographChecker;
	getter: PictographGetter;
	propPlacementManager: PropPlacementManager | null = null;
	arrowPlacementManager: ArrowPlacementManager | null = null;
	svgManager: SvgManager;

	constructor(pictographData: PictographData) {
		this.checker = new PictographChecker(pictographData);
		this.getter = new PictographGetter(pictographData);
		this.svgManager = new SvgManager();
	}
}
