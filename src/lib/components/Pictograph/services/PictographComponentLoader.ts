import { get, type Writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { Color, Loc } from '$lib/types/Types';
import { PropType } from '$lib/types/Types';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import ArrowLocationManager from '$lib/components/objects/Arrow/ArrowLocationManager/ArrowLocationManager';
import { PictographGetter } from '../PictographGetter';

/**
 * Service class responsible for creating component data from motion data
 */
export class PictographComponentLoader {
    private pictographGetter: PictographGetter;

    constructor(private pictographDataStore: Writable<PictographData>) {
        this.pictographGetter = new PictographGetter(get(pictographDataStore));
    }

    /**
     * Creates prop data from motion data
     */
    createPropFromMotion(motionData: MotionData, color: Color): PropData {
        return {
            id: crypto.randomUUID(),
            motionId: motionData.id,
            color: color,
            propType: PropType.STAFF,
            radialMode: ['in', 'out'].includes(motionData.endOri) ? 'radial' : 'nonradial',
            ori: motionData.endOri,
            coords: { x: 0, y: 0 }, // Will be positioned later
            loc: motionData.endLoc,
            rotAngle: 0
        };
    }

    /**
     * Creates arrow data from motion data
     */
    createArrowFromMotion(motionData: any, color: Color): ArrowData {
        // Create the Motion object from motion data if it doesn't exist
        if (!this.pictographGetter.initialized) {
            this.pictographGetter.initializeMotions();
        }
        
        // Get the motion object
        const motion = color === 'red' 
            ? get(this.pictographDataStore).redMotion 
            : get(this.pictographDataStore).blueMotion;
        
        // Calculate the arrow location using the ArrowLocationManager
        let arrowLoc: Loc = motionData.endLoc; // Default fallback
        
        if (motion) {
            try {
                const locationManager = new ArrowLocationManager(this.pictographGetter);
                const calculatedLoc = locationManager.getArrowLocation(motion);
                if (calculatedLoc) {
                    arrowLoc = calculatedLoc;
                }
            } catch (error) {
                console.error('Failed to calculate arrow location:', error);
            }
        }

        return {
            id: crypto.randomUUID(),
            motionId: motionData.id,
            color: color,
            coords: { x: 0, y: 0 }, // Will be positioned later
            loc: arrowLoc, // Use the calculated location
            rotAngle: 0,
            svgMirrored: false,
            svgCenter: { x: 0, y: 0 },
            svgLoaded: false,
            svgData: null,
            motionType: motionData.motionType,
            startOri: motionData.startOri,
            endOri: motionData.endOri,
            turns: motionData.turns,
            propRotDir: motionData.propRotDir
        };
    }

    /**
     * Updates the pictograph data in the getter
     */
    updateGetter(): void {
        this.pictographGetter.updateData(get(this.pictographDataStore));
    }
}