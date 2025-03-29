// src/lib/components/Pictograph/core/PictographManagers.ts
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
import { Logger } from '$lib/utils/Logger';

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
	private pictographDataStore: Writable<PictographData>;
	private logger: Logger;

	constructor(pictographDataStore: Writable<PictographData>) {
		this.pictographDataStore = pictographDataStore;
		const pictographData = get(this.pictographDataStore);
		this.checker = new PictographChecker(pictographData);
		this.getter = new PictographGetter(pictographData);
		this.svgManager = new SvgManager();
		this.logger = new Logger('PictographManagers');

		this.ready = new Promise<void>((resolve, reject) => {
			this.resolveReady = resolve;
			this.rejectReady = reject;
		});

		this.logger.debug('Created. Waiting for grid data...');
	}

	/**
	 * Initialize placement managers with grid data
	 * @returns Promise that resolves when managers are initialized
	 */
	async initializePlacementManagers(forceGridData?: GridData) {
		if (this.initialized) {
			this.logger.debug('Placement managers already initialized.');
			return this.ready;
		}

		this.logger.debug('Initializing placement managers...');

		try {
			const pictographData = get(this.pictographDataStore);
			if (!pictographData) {
				throw new Error('Pictograph data is missing during placement manager initialization.');
			}

			// Use provided grid data or get from pictograph data
			let gridData = forceGridData || pictographData.gridData;

			// If no grid data is available, create a default empty grid
			if (!gridData) {
				this.logger.warn('Grid data not available. Using fallback empty grid.');
				gridData = this.createFallbackGridData();
			}

			this.logger.debug('Grid data found. Validating...');
			this.validateGridData(gridData);

			this.propPlacementManager = new PropPlacementManager(pictographData, gridData, this.checker);
			this.arrowPlacementManager = new ArrowPlacementManager(
				pictographData,
				gridData,
				this.checker
			);

			await this.propPlacementManager.ready;
			console.log('propPlacementManager ready');
			if (this.arrowPlacementManager) {
				await this.arrowPlacementManager.ready;
			}

			this.initialized = true;
			this.resolveReady();
			this.logger.debug('Placement managers initialized successfully.');
		} catch (error) {
			this.logger.error('Error initializing placement managers:', error);
			this.initialized = false;
			this.rejectReady(error);
			throw error;
		}
	}

	/**
	 * Creates a fallback grid data object when real grid data is unavailable
	 */
	private createFallbackGridData(): GridData {
		// Create minimal grid data with required fields
		return {
			allHandPointsNormal: this.createDefaultHandPoints()
			// Add other required fields as needed
		} as GridData;
	}

	/**
	 * Creates default hand points for fallback grid
	 */
	private createDefaultHandPoints() {
		const points: Record<string, any> = {};

		// Add default points for common positions
		const positions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
		const modes = ['box', 'diamond'];

		for (const pos of positions) {
			for (const mode of modes) {
				const key = `${pos}_${mode}_hand_point`;
				points[key] = {
					coordinates: this.getDefaultCoordinates(pos)
				};
			}
		}

		return points;
	}

	/**
	 * Get default coordinates for a position
	 */
	private getDefaultCoordinates(position: string) {
		const center = 475;
		const offset = 150;

		// Generate coordinates based on position
		switch (position) {
			case 'n':
				return { x: center, y: center - offset };
			case 's':
				return { x: center, y: center + offset };
			case 'e':
				return { x: center + offset, y: center };
			case 'w':
				return { x: center - offset, y: center };
			case 'ne':
				return { x: center + offset, y: center - offset };
			case 'nw':
				return { x: center - offset, y: center - offset };
			case 'se':
				return { x: center + offset, y: center + offset };
			case 'sw':
				return { x: center - offset, y: center + offset };
			default:
				return { x: center, y: center };
		}
	}

	/**
	 * Validates grid data structure
	 */
	private validateGridData(gridData: GridData): void {
		if (!gridData || typeof gridData !== 'object') {
			throw new Error('Grid data is invalid or not an object.');
		}

		if (!gridData.allHandPointsNormal || typeof gridData.allHandPointsNormal !== 'object') {
			this.logger.error('Missing or invalid `allHandPointsNormal` in grid data.');
			throw new Error('Invalid grid data structure: missing allHandPointsNormal.');
		}

		const sampleKeys = Object.keys(gridData.allHandPointsNormal).slice(0, 2);
		if (sampleKeys.length > 0) {
			const firstPoint = gridData.allHandPointsNormal[sampleKeys[0]];
			if (
				!firstPoint ||
				typeof firstPoint.coordinates?.x !== 'number' ||
				typeof firstPoint.coordinates?.y !== 'number'
			) {
				this.logger.warn('Sample grid point structure seems incorrect.', firstPoint);
			} else {
				this.logger.debug(`Grid data structure looks okay (checked point ${sampleKeys[0]})`);
			}
		} else if (Object.keys(gridData.allHandPointsNormal).length === 0) {
			this.logger.warn('Grid data `allHandPointsNormal` is empty.');
		}
	}

	/**
	 * Updates internal state with new data
	 */
	async updateData(gridData?: GridData) {
		this.logger.debug('Updating internal state with new data...');

		try {
			const pictographData = get(this.pictographDataStore);
			this.checker = new PictographChecker(pictographData);
			this.getter = new PictographGetter(pictographData);
			this.initialized = false;
			await this.initializePlacementManagers(gridData);
			this.logger.debug('Internal state updated.');
		} catch (error) {
			this.logger.error('Error updating with new data:', error);
			throw error;
		}
	}

	/**
	 * Validates prop and arrow placements
	 */
	validatePlacements(props: (PropData | null)[], arrows: (ArrowData | null)[]): boolean {
		let valid = true;

		props.forEach((prop, index) => {
			if (
				prop &&
				(!prop.coords || typeof prop.coords.x !== 'number' || typeof prop.coords.y !== 'number')
			) {
				this.logger.error(
					`Validation failed: Prop ${index} (${prop.color}) has invalid coordinates.`,
					prop.coords
				);
				valid = false;
			}
		});

		arrows.forEach((arrow, index) => {
			if (
				arrow &&
				(!arrow.coords || typeof arrow.coords.x !== 'number' || typeof arrow.coords.y !== 'number')
			) {
				this.logger.warn(
					`Validation warning: Arrow ${index} (${arrow.color}) has missing or invalid coordinates.`,
					arrow.coords
				);
			}
		});

		return valid;
	}
}
