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
	ready: Promise<void>;
	private resolveReady!: () => void;
	private rejectReady!: (reason?: any) => void;

	constructor(private pictographDataStore: Writable<PictographData>) {
		const pictographData = get(pictographDataStore); // ✅ Always retrieve the data from store

		this.checker = new PictographChecker(pictographData);
		this.getter = new PictographGetter(pictographData);
		this.svgManager = new SvgManager();
		
		// Create a promise to track initialization
		this.ready = new Promise<void>((resolve, reject) => {
			this.resolveReady = resolve;
			this.rejectReady = reject;
		});

		// ✅ Initialize placement managers asynchronously
		this.initializePlacementManagers()
			.then(() => this.resolveReady())
			.catch((error) => {
				console.error('Failed to initialize placement managers:', error);
				this.rejectReady(error);
			});
	}

	private async initializePlacementManagers() {
		try {
			const pictographData = get(this.pictographDataStore);
			const gridData = pictographData?.gridData || null;

			if (!gridData) {
				console.error('❌ Grid data is missing. Placement managers cannot be initialized.');
				throw new Error('Grid data is missing');
			}

			this.propPlacementManager = new PropPlacementManager(pictographData, gridData, this.checker);
			this.arrowPlacementManager = new ArrowPlacementManager(pictographData, gridData, this.checker);
			
			console.log('✅ Placement managers initialized successfully');
		} catch (error) {
			console.error('❌ Error initializing placement managers:', error);
			throw error;
		}
	}

	async updateData() {
		try {
			const pictographData = get(this.pictographDataStore);
			this.checker = new PictographChecker(pictographData);
			this.getter = new PictographGetter(pictographData);

			// Reinitialize placement managers with new data
			await this.initializePlacementManagers();
		} catch (error) {
			console.error('❌ Error updating managers with new data:', error);
			throw error;
		}
	}
	
	// Add a function to validate placements have been applied correctly
	validatePlacements(props: any[], arrows: any[]): boolean {
		if (props.some(prop => !prop.coords || prop.coords.x === undefined || prop.coords.y === undefined)) {
			console.error('❌ Validation failed: Props have invalid coordinates');
			return false;
		}
		
		if (arrows.some(arrow => !arrow.coords || arrow.coords.x === undefined || arrow.coords.y === undefined)) {
			console.error('❌ Validation failed: Arrows have invalid coordinates');
			return false;
		}
		
		return true;
	}
}