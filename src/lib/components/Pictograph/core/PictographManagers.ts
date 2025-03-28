// src/lib/components/Pictograph/PictographManagers.ts
import { get, type Writable } from 'svelte/store';
import { PictographChecker } from './PictographChecker';
import { PictographGetter } from './PictographGetter';
import { PropPlacementManager } from '$lib/components/PlacementManagers/PropPlacementManager/PropPlacementManager';
import { ArrowPlacementManager } from '$lib/components/PlacementManagers/ArrowPlacementManager/ArrowPlacementManager';
import SvgManager from '$lib/components/SvgManager/SvgManager';
import type { PictographData } from '$lib/types/PictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';


/**
 * Manages auxiliary services and data accessors related to a Pictograph.
 * This includes:
 * - `PictographChecker`: For checking conditions based on pictograph data.
 * - `PictographGetter`: For retrieving derived data or specific components.
 * - `PropPlacementManager`: For calculating prop positions.
 * - `ArrowPlacementManager`: For calculating arrow positions.
 * - `SvgManager`: For handling SVG asset loading/management (if needed here).
 *
 * It ensures that placement managers are initialized only after grid data is available.
 */
export class PictographManagers {
	/** Checks conditions based on current pictograph data. */
	checker: PictographChecker;
	/** Retrieves derived data or components from current pictograph data. */
	getter: PictographGetter;
	/** Manages prop positioning logic. Null until initialized. */
	propPlacementManager: PropPlacementManager | null = null;
	/** Manages arrow positioning logic. Null until initialized. */
	arrowPlacementManager: ArrowPlacementManager | null = null;
	/** Manages SVG assets (can be shared or instantiated per pictograph). */
	svgManager: SvgManager;

	/** Promise resolving when managers (esp. placement) are ready. */
	ready: Promise<void>;
	/** Function to resolve the `ready` promise. */
	public resolveReady!: () => void;
	/** Function to reject the `ready` promise. */
	private rejectReady!: (reason?: any) => void;

	/** Flag indicating successful initialization of placement managers. */
	private initialized: boolean = false;
	/** Enables detailed console logging. */
	private debugMode: boolean = true; // Set to false for production

	/** Reference to the main pictograph data store. */
	private pictographDataStore: Writable<PictographData>;

	constructor(pictographDataStore: Writable<PictographData>) {
		this.pictographDataStore = pictographDataStore;
		const pictographData = get(this.pictographDataStore);

		// Initialize non-placement managers immediately
		this.checker = new PictographChecker(pictographData);
		this.getter = new PictographGetter(pictographData);
		this.svgManager = new SvgManager(); // Assuming a shared or new instance is okay

		this.ready = new Promise<void>((resolve, reject) => {
			this.resolveReady = resolve;
			this.rejectReady = reject;
		});

		if (this.debugMode) console.log('🔄 PictographManagers: Created. Waiting for grid data...');

		// Defer placement manager initialization until grid data is confirmed
		// This is typically triggered after the Grid component emits 'PointsReady'
	}

	/**
	 * Initializes the placement managers (`PropPlacementManager`, `ArrowPlacementManager`).
	 * This method should be called *after* the grid data has been added to the
	 * `pictographDataStore`.
	 */
	async initializePlacementManagers() {
		if (this.initialized) {
			if (this.debugMode) console.log('✅ PictographManagers: Placement managers already initialized.');
			return this.ready;
		}

		if (this.debugMode) console.log('🚀 PictographManagers: Initializing placement managers...');

		try {
			const pictographData = get(this.pictographDataStore);

			if (!pictographData) {
				// This should ideally not happen if called correctly
				throw new Error('Pictograph data is missing during placement manager initialization.');
			}

			// Crucial Check: Ensure gridData exists
			const gridData = pictographData.gridData;
			if (!gridData) {
				// If gridData is missing here, it indicates a logic error in the calling sequence.
				// The Grid component should have emitted pointsReady, and the store updated BEFORE this is called.
				throw new Error('Grid data is not available in the pictograph store. Ensure Grid emitted pointsReady and store was updated.');
			}

			if (this.debugMode) {
				console.log('📊 PictographManagers: Grid data found. Validating...');
				this.validateGridData(gridData); // Perform validation
			}

			// Create placement managers using the validated grid data
			this.propPlacementManager = new PropPlacementManager(pictographData, gridData, this.checker);
			this.arrowPlacementManager = new ArrowPlacementManager(pictographData, gridData, this.checker);

			// Wait for readiness (assuming they might have async setup)
			// Prop manager readiness might be more critical for initial layout
			await this.propPlacementManager.ready;
			if (this.arrowPlacementManager) {
				await this.arrowPlacementManager.ready;
			}

			this.initialized = true;
			this.resolveReady(); // Signal readiness
			if (this.debugMode) console.log('✅ PictographManagers: Placement managers initialized successfully.');

		} catch (error) {
			console.error('❌ PictographManagers: Error initializing placement managers:', error);
			this.initialized = false;
			this.rejectReady(error); // Reject the promise
			throw error; // Re-throw for upstream handling
		}
	}

	/**
	 * Validates the structure of the GridData object, especially the hand points.
	 * @param gridData - The grid data object to validate.
	 */
	private validateGridData(gridData: GridData): void {
		if (!gridData || typeof gridData !== 'object') {
			throw new Error('Grid data is invalid or not an object.');
		}
		if (!gridData.allHandPointsNormal || typeof gridData.allHandPointsNormal !== 'object') {
			console.error('❌ PictographManagers: Missing or invalid `allHandPointsNormal` in grid data.');
			throw new Error('Invalid grid data structure: missing allHandPointsNormal.');
		} else {
			// Optional: Check a few sample points for expected structure
			const sampleKeys = Object.keys(gridData.allHandPointsNormal).slice(0, 2);
			if (sampleKeys.length > 0) {
				const firstPoint = gridData.allHandPointsNormal[sampleKeys[0]];
				if (!firstPoint || typeof firstPoint.coordinates?.x !== 'number' || typeof firstPoint.coordinates?.y !== 'number') {
					console.warn('⚠️ PictographManagers: Sample grid point structure seems incorrect.', firstPoint);
					// Not throwing an error here, but logging a warning.
				} else {
					if (this.debugMode) console.log(`👍 PictographManagers: Grid data structure looks okay (checked point ${sampleKeys[0]})`);
				}
			} else if (Object.keys(gridData.allHandPointsNormal).length === 0) {
                 console.warn('⚠️ PictographManagers: Grid data `allHandPointsNormal` is empty.');
                 // Depending on requirements, this might be an error
                 // throw new Error('Invalid grid data: allHandPointsNormal is empty.');
            }
		}
		// Add more checks if necessary (e.g., grid center, mode)
	}

	/**
	 * Updates the internal state of managers when pictograph data changes significantly.
	 * Re-initializes checkers, getters, and potentially placement managers.
	 * Note: This might be complex if placement managers depend heavily on initial grid data.
	 * Consider if a full re-render/re-instantiation of Pictograph is simpler.
	 */
	async updateData() {
		if (this.debugMode) console.log('🔄 PictographManagers: Updating internal state with new data...');
		try {
			const pictographData = get(this.pictographDataStore);
			this.checker = new PictographChecker(pictographData); // Recreate checker
			this.getter = new PictographGetter(pictographData); // Recreate getter

			// Placement managers might need more careful updates or full re-initialization
			// depending on whether gridData changes. For simplicity, let's assume
			// they need re-initialization if data changes significantly.
			this.initialized = false; // Reset initialization flag
			await this.initializePlacementManagers(); // Re-run initialization

			if (this.debugMode) console.log('✅ PictographManagers: Internal state updated.');
		} catch (error) {
			console.error('❌ PictographManagers: Error updating with new data:', error);
			throw error; // Propagate error
		}
	}

    /**
	 * Simple validation to check if props/arrows have received coordinates.
     * Useful after positioning steps.
	 * @param props - Array of PropData objects.
	 * @param arrows - Array of ArrowData objects.
	 * @returns `true` if basic coordinates seem present, `false` otherwise.
	 */
	validatePlacements(props: (PropData | null)[], arrows: (ArrowData | null)[]): boolean {
        let valid = true;
		props.forEach((prop, index) => {
            if (prop && (!prop.coords || typeof prop.coords.x !== 'number' || typeof prop.coords.y !== 'number')) {
                console.error(`❌ PictographManagers: Validation failed: Prop ${index} (${prop.color}) has invalid coordinates.`, prop.coords);
                valid = false;
            }
        });

		arrows.forEach((arrow, index) => {
            // Arrow coords might be less critical or calculated differently, adjust check as needed
            if (arrow && (!arrow.coords || typeof arrow.coords.x !== 'number' || typeof arrow.coords.y !== 'number')) {
                 console.warn(`⚠️ PictographManagers: Validation warning: Arrow ${index} (${arrow.color}) has missing or invalid coordinates.`, arrow.coords);
                 // Decide if this should cause failure: valid = false;
            }
        });

		return valid;
	}
}