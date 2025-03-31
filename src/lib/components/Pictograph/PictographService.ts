import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { Color, Loc } from '$lib/types/Types';
import { PropType } from '$lib/types/Types';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import { Motion } from '$lib/components/objects/Motion/Motion';
import { RED, BLUE } from '$lib/types/Constants';
import ArrowRotAngleManager from '$lib/components/objects/Arrow/ArrowRotAngleManager';
import ArrowLocationManager from '$lib/components/objects/Arrow/ArrowLocationManager';
import { BetaPropPositioner } from '$lib/components/PlacementManagers/PropPlacementManager/BetaPropPositioner';
import { PictographChecker } from './PictographChecker';
import { ArrowPlacementManager } from '../PlacementManagers/ArrowPlacementManager/ArrowPlacementManager';

/**
 * Unified service for Pictograph operations
 * Consolidates functionality from PictographGetter, PictographComponentLoader,
 * and PictographComponentPositioner
 */
export class PictographService {
	private cache = new Map<string, any>();
	public initialized = false;
	private checker: PictographChecker;

	constructor(private data: PictographData) {
		this.checker = new PictographChecker(data);
		this.initialize();
	}

	/**
	 * Initialize motion objects from motion data
	 */
	initialize(): void {
		try {
			if (this.data.redMotionData && !this.data.redMotion) {
				this.data.redMotion = new Motion(this.data, this.data.redMotionData);
			}
			if (this.data.blueMotionData && !this.data.blueMotion) {
				this.data.blueMotion = new Motion(this.data, this.data.blueMotionData);
			}
			this.initialized = true;
		} catch (error) {
			console.error('Motion initialization failed:', error);
			this.initialized = false;
		}
	}

	// === MOTION OPERATIONS (from PictographGetter) ===

	/**
	 * Gets the shift motion (pro, anti, or float)
	 */
	getShiftMotion(): Motion | null {
		return this.getCached('shiftMotion', () => {
			const motions = [this.data.redMotion, this.data.blueMotion].filter((m) => m?.motionType);
			return motions.find((m) => ['pro', 'anti', 'float'].includes(m!.motionType)) ?? null;
		});
	}

	/**
	 * Gets the opposite motion of the given motion
	 */
	getOtherMotion(motion: Motion): Motion | null {
		const cacheKey = `otherMotion:${motion.id}`;
		return this.getCached(cacheKey, () => {
			if (!this.initialized) return null;
			const otherColor = motion.color === RED ? BLUE : RED;
			return this.motionByColor(otherColor);
		});
	}

	/**
	 * Gets motion by color
	 */
	private motionByColor(color: string): Motion | null {
		const cacheKey = `motionByColor:${color}`;
		return this.getCached(cacheKey, () => {
			return (color === RED ? this.data.redMotion : this.data.blueMotion) ?? null;
		});
	}

	// === COMPONENT CREATION (from PictographComponentLoader) ===

	/**
	 * Creates prop data from motion data
	 */
	createPropData(motionData: MotionData, color: Color): PropData {
		return {
			id: crypto.randomUUID(),
			motionId: motionData.id,
			color,
			propType: PropType.STAFF,
			radialMode: ['in', 'out'].includes(motionData.endOri) ? 'radial' : 'nonradial',
			ori: motionData.endOri,
			coords: { x: 0, y: 0 },
			loc: motionData.endLoc,
			rotAngle: 0
		};
	}

	/**
	 * Creates arrow data from motion data
	 */
	createArrowData(motionData: MotionData, color: Color): ArrowData {
		// Initialize motions if needed
		if (!this.initialized) {
			this.initialize();
		}

		// Calculate arrow location
		const motion = color === 'red' ? this.data.redMotion : this.data.blueMotion;
		const arrowLoc = motion
			? this.calculateArrowLocation(motion, motionData.endLoc)
			: motionData.endLoc;

		return {
			id: crypto.randomUUID(),
			motionId: motionData.id,
			color,
			coords: { x: 0, y: 0 },
			loc: arrowLoc,
			rotAngle: 0,
			svgMirrored: false,
			svgCenter: { x: 0, y: 0 },
			svgLoaded: false,
			svgData: null,
			...(({ id: _id, color: _color, ...rest }) => rest)(motionData)
		};
	}

	/**
	 * Calculates arrow location with fallback
	 */
	private calculateArrowLocation(motion: Motion | null, defaultLoc: Loc): Loc {
		if (!motion) return defaultLoc;

		try {
			const locationManager = new ArrowLocationManager(this);
			return locationManager.getArrowLocation(motion) ?? defaultLoc;
		} catch {
			return defaultLoc;
		}
	}

	// === COMPONENT POSITIONING (from PictographComponentPositioner) ===

	/**
	 * Positions all components based on grid data
	 */
	positionComponents(
		redProp: PropData | null,
		blueProp: PropData | null,
		redArrow: ArrowData | null,
		blueArrow: ArrowData | null,
		grid: GridData
	): void {
		// Position props
		if (redProp) this.positionProp(redProp, grid);
		if (blueProp) this.positionProp(blueProp, grid);

		// Apply special beta positioning if needed
		if (redProp && blueProp && this.checker.endsWithBeta()) {
			try {
				new BetaPropPositioner(this.data).reposition([redProp, blueProp]);
			} catch (error) {
				console.warn('Beta positioning error:', error);
			}
		}

		// Position arrows
		this.positionArrows(redArrow, blueArrow, grid);
	}

	/**
	 * Position a single prop on the grid
	 */
	positionProp(prop: PropData, grid: GridData): void {
		const pointName = `${prop.loc}_${this.data.gridMode}_hand_point`;
		prop.coords =
			grid.allHandPointsNormal?.[pointName]?.coordinates ?? this.getFallbackPosition(prop.loc);
	}

	/**
	 * Position arrows based on motions
	 */
	positionArrows(redArrow: ArrowData | null, blueArrow: ArrowData | null, grid: GridData): void {
		// Position red arrow
		if (redArrow && this.data.redMotion) {
			const locationManager = new ArrowLocationManager(this);
			const arrowLoc = locationManager.getArrowLocation(this.data.redMotion);

			if (arrowLoc) {
				redArrow.loc = arrowLoc;
				const rotAngleManager = new ArrowRotAngleManager();
				redArrow.rotAngle = rotAngleManager.updateRotation(this.data.redMotion, arrowLoc);
			}
		}

		// Position blue arrow
		if (blueArrow && this.data.blueMotion) {
			const locationManager = new ArrowLocationManager(this);
			const arrowLoc = locationManager.getArrowLocation(this.data.blueMotion);

			if (arrowLoc) {
				blueArrow.loc = arrowLoc;
				const rotAngleManager = new ArrowRotAngleManager();
				blueArrow.rotAngle = rotAngleManager.updateRotation(this.data.blueMotion, arrowLoc);
			}
		}

		// Apply advanced arrow positioning if both arrows exist
		if (redArrow && blueArrow) {
			try {
				const placementManager = new ArrowPlacementManager(this.data, grid, this.checker);
				placementManager.updateArrowPlacements([redArrow, blueArrow]);
			} catch (error) {
				console.warn('Arrow placement error:', error);
			}
		}
	}

	/**
	 * Get fallback position for when grid data fails
	 */
	private getFallbackPosition(loc?: string): { x: number; y: number } {
		const fallbackPositions: Record<string, { x: number; y: number }> = {
			n: { x: 475, y: 330 },
			e: { x: 620, y: 475 },
			s: { x: 475, y: 620 },
			w: { x: 330, y: 475 },
			ne: { x: 620, y: 330 },
			se: { x: 620, y: 620 },
			sw: { x: 330, y: 620 },
			nw: { x: 330, y: 330 }
		};

		return loc && fallbackPositions[loc] ? fallbackPositions[loc] : { x: 475, y: 475 };
	}

	// === CACHING AND STATE MANAGEMENT ===

	/**
	 * Helper method for memoizing expensive operations
	 */
	private getCached<T>(key: string, producer: () => T): T {
		if (!this.cache.has(key)) {
			try {
				this.cache.set(key, producer());
			} catch (error) {
				console.error(`Cache computation failed for ${key}:`, error);
				return null as unknown as T;
			}
		}
		return this.cache.get(key);
	}

	/**
	 * Update data and reset cache
	 */
	updateData(newData: PictographData): void {
		this.data = newData;
		this.cache.clear();
		this.checker = new PictographChecker(newData);
		this.initialize();
	}
}
