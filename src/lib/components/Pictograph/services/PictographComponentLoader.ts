// src/lib/components/Pictograph/services/PictographComponentLoader.ts
import { get, type Writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { Color } from '$lib/types/Types';
import { PropType } from '$lib/types/Types';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';

/**
 * Service class responsible for creating component data from motion data
 */
export class PictographComponentLoader {
    constructor(private pictographDataStore: Writable<PictographData>) {}

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
        return {
            id: crypto.randomUUID(),
            motionId: motionData.id,
            color: color,
            coords: { x: 0, y: 0 }, // Will be positioned later
            loc: motionData.endLoc,
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
}