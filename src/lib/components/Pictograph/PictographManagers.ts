import { get, type Writable } from 'svelte/store';
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

	constructor(private pictographDataStore: Writable<PictographData>) {
		const pictographData = get(pictographDataStore); // ✅ Always retrieve the data from store

		this.checker = new PictographChecker(pictographData);
		this.getter = new PictographGetter(pictographData);
		this.svgManager = new SvgManager();

		// ✅ Initialize placement managers when constructing
		this.initializePlacementManagers();
	}

	private initializePlacementManagers() {
		const pictographData = get(this.pictographDataStore);
		const gridData = pictographData?.gridData || null;

		if (!gridData) {
			console.error('❌ Grid data is missing. Placement managers cannot be initialized.');
			return;
		}

		this.propPlacementManager = new PropPlacementManager(pictographData, gridData, this.checker);
		this.arrowPlacementManager = new ArrowPlacementManager(pictographData, gridData, this.checker);
	}

	updateData() {
		const pictographData = get(this.pictographDataStore);
		this.checker = new PictographChecker(pictographData);
		this.getter = new PictographGetter(pictographData);

		// Ensure placement managers update with new data
		this.initializePlacementManagers();
	}
}
