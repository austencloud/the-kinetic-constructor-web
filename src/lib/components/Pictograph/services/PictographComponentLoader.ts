import { get, type Writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { Color, Loc } from '$lib/types/Types';
import { PropType } from '$lib/types/Types';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import ArrowLocationManager from '$lib/components/objects/Arrow/ArrowLocationManager';
import { PictographGetter } from '../PictographGetter';
import { Motion } from '$lib/components/objects/Motion/Motion';

/**
 * Responsible for creating component data from motion data
 */
export class PictographComponentLoader {
	private readonly pictographGetter: PictographGetter;

	constructor(private pictographDataStore: Writable<PictographData>) {
		this.pictographGetter = new PictographGetter(get(pictographDataStore));
	}

	/**
	 * Creates prop data from motion data
	 * @param motionData - Source motion data
	 * @param color - Prop color
	 * @returns Fully configured PropData
	 */
	createPropFromMotion(motionData: MotionData, color: Color): PropData {
		return {
			id: crypto.randomUUID(),
			motionId: motionData.id,
			color,
			propType: PropType.STAFF,
			radialMode: ['in', 'out'].includes(motionData.endOri) ? 'radial' : 'nonradial',
			ori: motionData.endOri,
			coords: { x: 0, y: 0 }, // Positioning handled separately
			loc: motionData.endLoc,
			rotAngle: 0
		};
	}

	/**
	 * Creates arrow data from motion data
	 * @param motionData - Source motion data
	 * @param color - Arrow color
	 * @returns Fully configured ArrowData
	 */
	createArrowFromMotion(motionData: MotionData, color: Color): ArrowData {
		// Ensure motions are initialized
		if (!this.pictographGetter.initialized) {
			this.pictographGetter.initializeMotions();
		}

		// Get the corresponding motion object
		const motion = this.getMotionByColor(color);
		const arrowLoc = this.calculateArrowLocation(motion, motionData.endLoc);

		return {
			id: crypto.randomUUID(),
			motionId: motionData.id,
			color,
			coords: { x: 0, y: 0 }, // Positioning handled separately
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
	 * Retrieves motion object by color
	 * @param color - Motion color
	 * @returns Motion object or null
	 */
	private getMotionByColor(color: Color): Motion | null {
		const data = get(this.pictographDataStore);
		if (color === 'red') {
			return data.redMotion !== undefined ? data.redMotion : null;
		} else {
			return data.blueMotion !== undefined ? data.blueMotion : null;
		}
	}

	/**
	 * Calculates arrow location with fallback
	 * @param motion - Source motion
	 * @param defaultLoc - Fallback location
	 * @returns Calculated or default location
	 */
	private calculateArrowLocation(motion: Motion | null, defaultLoc: Loc): Loc {
		if (!motion) return defaultLoc;

		try {
			const locationManager = new ArrowLocationManager(this.pictographGetter);
			return locationManager.getArrowLocation(motion) ?? defaultLoc;
		} catch {
			return defaultLoc;
		}
	}

	/**
	 * Updates the pictograph data in the getter
	 */
	updateGetter(): void {
		this.pictographGetter.updateData(get(this.pictographDataStore));
	}
}
