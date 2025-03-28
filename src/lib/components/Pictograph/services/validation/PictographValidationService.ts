import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { PictographData } from '$lib/types/PictographData';
import { get, type Writable } from 'svelte/store';
import type { RenderStage } from '../../constants/trackingConstants';

export class PictographValidationService {
    private debug: boolean;
    private pictographDataStore: Writable<PictographData>;

    constructor(pictographDataStore: Writable<PictographData>, debug: boolean = false) {
        this.pictographDataStore = pictographDataStore;
        this.debug = debug;
        if (this.debug)
            console.log('🔄 ValidationService: Initialized');
    }

    public isDataCompleteForRendering(
        redProp: PropData | null,
        blueProp: PropData | null,
        redArrow: ArrowData | null,
        blueArrow: ArrowData | null,
        stage: RenderStage,
        initializationAttempted: boolean
    ): boolean {
        const pictograph = get(this.pictographDataStore);
        if (!pictograph?.redMotionData || !pictograph?.blueMotionData) {
            if (this.debug && initializationAttempted)
                console.log(
                    '📉 ValidationService (isDataComplete): Fail - Missing core red/blue motion data.'
                );
            return false;
        }

        if (!redProp || !blueProp || !redArrow || !blueArrow) {
            if (
                initializationAttempted &&
                stage !== 'loading' &&
                stage !== 'initializing' &&
                stage !== 'grid_ready'
            ) {
                if (this.debug) {
                    console.log(
                        `📉 ValidationService (isDataComplete): Fail - Missing derived components (Stage: ${stage}). ` +
                        `R:${!!redProp}, B:${!!blueProp}, RA:${!!redArrow}, BA:${!!blueArrow}`
                    );
                }
                return false;
            }
        }

        if (
            this.debug &&
            stage === 'complete' &&
            (!redProp || !blueProp || !redArrow || !blueArrow)
        ) {
            console.warn(
                `📈 ValidationService (isDataComplete): Data considered complete, but stage is 'complete' ` +
                `and components are missing. Possible fallback scenario.`
            );
        }
        return true;
    }

    public validateArrowDataForPositioning(arrow: ArrowData | null): boolean {
        if (!arrow) {
            return false;
        }

        const hasMotionType = !!arrow.motionType;
        const hasStartOri = !!arrow.startOri;
        const hasTurns = typeof arrow.turns === 'number';
        const hasPropRotDir = !!arrow.propRotDir;
        return hasMotionType && hasStartOri && hasTurns;
    }

    public validateInitialData(pictograph: PictographData | null): boolean {
        if (!pictograph) {
            if (this.debug)
                console.log(
                    '📉 ValidationService (validateInitial): Fail - Pictograph data is null.'
                );
            return false;
        }
        if (!pictograph.redMotionData || !pictograph.blueMotionData) {
            if (this.debug)
                console.log(
                    '📉 ValidationService (validateInitial): Fail - Missing red or blue motion data.'
                );
            return false;
        }
        if (this.debug)
            console.log(
                '📈 ValidationService (validateInitial): Pass - Core motion data present.'
            );
        return true;
    }
}
