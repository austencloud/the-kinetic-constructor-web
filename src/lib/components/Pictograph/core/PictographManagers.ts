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

export class PictographManagers {
	checker: PictographChecker;
	getter: PictographGetter;
	propPlacementManager: PropPlacementManager | null = null;
	arrowPlacementManager: ArrowPlacementManager | null = null;
	svgManager: SvgManager;
	ready: Promise<void>;
	public resolveReady!: () => void;
	private rejectReady!: (reason?: any) => void;
	private initialized: boolean = false;
	private debugMode: boolean = true;
	private pictographDataStore: Writable<PictographData>;

	constructor(pictographDataStore: Writable<PictographData>) {
		this.pictographDataStore = pictographDataStore;
		const pictographData = get(this.pictographDataStore);
		this.checker = new PictographChecker(pictographData);
		this.getter = new PictographGetter(pictographData);
		this.svgManager = new SvgManager();
		this.ready = new Promise<void>((resolve, reject) => {
			this.resolveReady = resolve;
			this.rejectReady = reject;
		});
		if (this.debugMode) console.log('🔄 PictographManagers: Created. Waiting for grid data...');
	}

	async initializePlacementManagers() {
		if (this.initialized) {
			if (this.debugMode)
				console.log('✅ PictographManagers: Placement managers already initialized.');
			return this.ready;
		}
		if (this.debugMode) console.log('🚀 PictographManagers: Initializing placement managers...');
		try {
			const pictographData = get(this.pictographDataStore);
			if (!pictographData) {
				throw new Error('Pictograph data is missing during placement manager initialization.');
			}
			const gridData = pictographData.gridData;
			if (!gridData) {
				throw new Error(
					'Grid data is not available in the pictograph store. Ensure Grid emitted pointsReady and store was updated.'
				);
			}
			if (this.debugMode) {
				console.log('📊 PictographManagers: Grid data found. Validating...');
				this.validateGridData(gridData);
			}
			this.propPlacementManager = new PropPlacementManager(pictographData, gridData, this.checker);
			this.arrowPlacementManager = new ArrowPlacementManager(
				pictographData,
				gridData,
				this.checker
			);
			await this.propPlacementManager.ready;
			if (this.arrowPlacementManager) {
				await this.arrowPlacementManager.ready;
			}
			this.initialized = true;
			this.resolveReady();
			if (this.debugMode)
				console.log('✅ PictographManagers: Placement managers initialized successfully.');
		} catch (error) {
			console.error('❌ PictographManagers: Error initializing placement managers:', error);
			this.initialized = false;
			this.rejectReady(error);
			throw error;
		}
	}

	private validateGridData(gridData: GridData): void {
		if (!gridData || typeof gridData !== 'object') {
			throw new Error('Grid data is invalid or not an object.');
		}
		if (!gridData.allHandPointsNormal || typeof gridData.allHandPointsNormal !== 'object') {
			console.error(
				'❌ PictographManagers: Missing or invalid `allHandPointsNormal` in grid data.'
			);
			throw new Error('Invalid grid data structure: missing allHandPointsNormal.');
		} else {
			const sampleKeys = Object.keys(gridData.allHandPointsNormal).slice(0, 2);
			if (sampleKeys.length > 0) {
				const firstPoint = gridData.allHandPointsNormal[sampleKeys[0]];
				if (
					!firstPoint ||
					typeof firstPoint.coordinates?.x !== 'number' ||
					typeof firstPoint.coordinates?.y !== 'number'
				) {
					console.warn(
						'⚠️ PictographManagers: Sample grid point structure seems incorrect.',
						firstPoint
					);
				} else {
					if (this.debugMode)
						console.log(
							`👍 PictographManagers: Grid data structure looks okay (checked point ${sampleKeys[0]})`
						);
				}
			} else if (Object.keys(gridData.allHandPointsNormal).length === 0) {
				console.warn('⚠️ PictographManagers: Grid data `allHandPointsNormal` is empty.');
			}
		}
	}

	async updateData() {
		if (this.debugMode)
			console.log('🔄 PictographManagers: Updating internal state with new data...');
		try {
			const pictographData = get(this.pictographDataStore);
			this.checker = new PictographChecker(pictographData);
			this.getter = new PictographGetter(pictographData);
			this.initialized = false;
			await this.initializePlacementManagers();
			if (this.debugMode) console.log('✅ PictographManagers: Internal state updated.');
		} catch (error) {
			console.error('❌ PictographManagers: Error updating with new data:', error);
			throw error;
		}
	}

	validatePlacements(props: (PropData | null)[], arrows: (ArrowData | null)[]): boolean {
		let valid = true;
		props.forEach((prop, index) => {
			if (
				prop &&
				(!prop.coords || typeof prop.coords.x !== 'number' || typeof prop.coords.y !== 'number')
			) {
				console.error(
					`❌ PictographManagers: Validation failed: Prop ${index} (${prop.color}) has invalid coordinates.`,
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
				console.warn(
					`⚠️ PictographManagers: Validation warning: Arrow ${index} (${arrow.color}) has missing or invalid coordinates.`,
					arrow.coords
				);
			}
		});
		return valid;
	}
}
