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

	constructor(private pictographDataStore: Writable<PictographData>) {
		console.log('🏗️ PictographManagers: Initializing...');
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
			console.log('✅ PictographManagers: Already initialized');
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
				console.log(`⏳ PictographManagers: Waiting for grid data (attempt ${attempts + 1}/${maxAttempts})...`);
				await new Promise(r => setTimeout(r, 100)); // Short delay
				pictographData.gridData = get(this.pictographDataStore).gridData;
				gridData = pictographData.gridData;
				attempts++;
			}

			if (!gridData) {
				console.error('❌ PictographManagers: Grid data not available after waiting');
				this.rejectReady(new Error('Grid data not available'));
				return;
			}

			console.log(`📊 PictographManagers: Grid data found with ${
				Object.keys(gridData.allHandPointsNormal || {}).length
			} hand points`);

			// Create the placement managers
			this.propPlacementManager = new PropPlacementManager(pictographData, gridData, this.checker);
			this.arrowPlacementManager = new ArrowPlacementManager(pictographData, gridData, this.checker);
			
			// Wait for both managers to be ready
			await Promise.all([
				this.propPlacementManager.ready,
				this.arrowPlacementManager ? this.arrowPlacementManager.ready : Promise.resolve()
			]);
			
			this.initialized = true;
			console.log('✅ PictographManagers: Placement managers initialized successfully');
			this.resolveReady();
		} catch (error) {
			console.error('❌ PictographManagers: Error initializing placement managers:', error);
			this.rejectReady(error);
		}
	}

	async updateData() {
		console.log('🔄 PictographManagers: Updating data...');
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
		if (props.some(prop => !prop.coords || prop.coords.x === undefined || prop.coords.y === undefined)) {
			console.error('❌ PictographManagers: Validation failed: Props have invalid coordinates');
			return false;
		}
		
		if (arrows.some(arrow => !arrow.coords || arrow.coords.x === undefined || arrow.coords.y === undefined)) {
			console.error('❌ PictographManagers: Validation failed: Arrows have invalid coordinates');
			return false;
		}
		
		return true;
	}
}