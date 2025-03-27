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
	private initialized: boolean = false;
	private debugMode: boolean = true;

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

		// Start initialization
		this.initializePlacementManagers();
	}

	async initializePlacementManagers() {
		if (this.initialized) {
			('✅ PictographManagers: Already initialized');
			return;
		}

		try {
			const pictographData = get(this.pictographDataStore);

			if (!pictographData) {
				throw new Error('No pictograph data available');
			}

			// Check for grid data, wait if needed
			let gridData = pictographData.gridData;
			let attempts = 0;
			const maxAttempts = 10;

			while (!gridData && attempts < maxAttempts) {

				await new Promise((r) => setTimeout(r, 100)); // Short delay
				const updatedData = get(this.pictographDataStore);
				gridData = updatedData.gridData;
				attempts++;
			}

			if (!gridData) {
				console.error('❌ PictographManagers: Grid data not available after waiting');
				this.rejectReady(new Error('Grid data not available'));
				return;
			}



			// Deep check grid data
			if (this.debugMode) {
				this.validateGridData(gridData);
			}

			// Create the placement managers
			this.propPlacementManager = new PropPlacementManager(pictographData, gridData, this.checker);
			this.arrowPlacementManager = new ArrowPlacementManager(
				pictographData,
				gridData,
				this.checker
			);

			// Wait for prop placement manager to be ready (critical)
			await this.propPlacementManager.ready;

			// Wait for arrow placement manager if available
			if (this.arrowPlacementManager) {
				await this.arrowPlacementManager.ready;
			}

			this.initialized = true;
			this.resolveReady();
		} catch (error) {
			console.error('❌ PictographManagers: Error initializing placement managers:', error);
			this.rejectReady(error);
		}
	}

	// Validate grid data structure
	private validateGridData(gridData: any) {
		if (!gridData.allHandPointsNormal) {
			console.error('❌ Missing allHandPointsNormal in grid data');
		} else {

			// Check a few sample points
			const samplePointKeys = Object.keys(gridData.allHandPointsNormal).slice(0, 3);
			samplePointKeys.forEach((key) => {
				const point = gridData.allHandPointsNormal[key];

			});
		}


	}

	async updateData() {
		try {
			const pictographData = get(this.pictographDataStore);
			this.checker = new PictographChecker(pictographData);
			this.getter = new PictographGetter(pictographData);

			// Re-initialize placement managers with new data
			this.initialized = false;
			await this.initializePlacementManagers();
		} catch (error) {
			console.error('❌ PictographManagers: Error updating with new data:', error);
			throw error;
		}
	}

	// Add a function to validate placements have been applied correctly
	validatePlacements(props: any[], arrows: any[]): boolean {
		if (
			props.some(
				(prop) => !prop.coords || prop.coords.x === undefined || prop.coords.y === undefined
			)
		) {
			console.error('❌ PictographManagers: Validation failed: Props have invalid coordinates');
			return false;
		}

		if (
			arrows.some(
				(arrow) => !arrow.coords || arrow.coords.x === undefined || arrow.coords.y === undefined
			)
		) {
			console.error('❌ PictographManagers: Validation failed: Arrows have invalid coordinates');
			return false;
		}

		return true;
	}
}
