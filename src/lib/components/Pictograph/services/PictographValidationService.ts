// src/lib/components/Pictograph/services/PictographValidationService.ts
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '../../objects/Prop/PropData';
import type { ArrowData } from '../../objects/Arrow/ArrowData';
import { get, type Writable } from 'svelte/store';
import type { RenderStage } from '../constants/trackingConstants';

/**
 * Service responsible for validating the completeness and consistency
 * of pictograph data and its constituent components (props, arrows).
 */
export class PictographValidationService {
    private debug: boolean;
    private pictographDataStore: Writable<PictographData>;

	constructor(
		pictographDataStore: Writable<PictographData>,
		debug: boolean = false
	) {
        this.pictographDataStore = pictographDataStore;
		this.debug = debug;
        if (this.debug) console.log('🔄 ValidationService: Initialized');
	}

	/**
	 * Checks if the pictograph has sufficient data to render *all* its visual components
	 * (Grid, Props, Arrows, Letter Glyph). This is stricter than the Initializer's check,
     * which only ensures enough data to *start* initialization.
	 *
	 * @param redProp - The current red prop data.
	 * @param blueProp - The current blue prop data.
	 * @param redArrow - The current red arrow data.
	 * @param blueArrow - The current blue arrow data.
     * @param stage - The current rendering stage.
     * @param initializationAttempted - Flag indicating if initializer.initialize() has been run.
	 * @returns `true` if data is considered complete for full rendering, `false` otherwise.
	 */
	public isDataCompleteForRendering(
		redProp: PropData | null,
		blueProp: PropData | null,
		redArrow: ArrowData | null,
		blueArrow: ArrowData | null,
        stage: RenderStage,
        initializationAttempted: boolean // Use a clearer name
	): boolean {
		const pictograph = get(this.pictographDataStore);

        // 1. Check core pictograph data requirements (must have motion data)
		if (!pictograph?.redMotionData || !pictograph?.blueMotionData) {
			if (this.debug && initializationAttempted) console.log('📉 ValidationService (isDataComplete): Fail - Missing core red/blue motion data.');
			return false;
		}

        // 2. Check derived component existence (props/arrows)
        // These should exist *after* successful initialization.
		if (!redProp || !blueProp || !redArrow || !blueArrow) {
            // Only fail if initialization should have completed. Don't fail during loading stages.
            // Allow rendering potentially just the grid if init failed or data was incomplete.
			if (initializationAttempted && stage !== 'loading' && stage !== 'initializing' && stage !== 'grid_ready') {
				if (this.debug) {
                    console.log(`📉 ValidationService (isDataComplete): Fail - Missing derived components (Stage: ${stage}). R:${!!redProp}, B:${!!blueProp}, RA:${!!redArrow}, BA:${!!blueArrow}`);
                }
				return false;
			}
            // If we are still loading, it's expected components might be null, so don't fail yet.
            // If init wasn't even attempted, we can't expect components.
		}

        // 3. Optional: Deeper checks on motion data properties if needed
		// if (!pictograph.redMotionData.motionType || !pictograph.redMotionData.startOri /* ...etc */) {
		//     if (this.debug) console.log('📉 ValidationService (isDataComplete): Fail - Incomplete properties within motion data.');
		//     return false;
		// }

        // If all checks pass, data is considered complete enough for full rendering attempt
        if (this.debug && stage === 'complete' && (!redProp || !blueProp || !redArrow || !blueArrow)) {
             console.warn(`📈 ValidationService (isDataComplete): Data considered complete, but stage is 'complete' and components are missing. Possible fallback scenario.`);
        } else if (this.debug && initializationAttempted && stage !== 'loading') {
            // console.log(`📈 ValidationService (isDataComplete): Pass - All checks satisfied (Stage: ${stage}).`);
        }
		return true;
	}

	/**
	 * Validates if a single ArrowData object contains the minimum required properties
	 * needed for the `ArrowPlacementManager` to position it correctly.
	 *
	 * @param arrow - The arrow data object to validate.
	 * @returns `true` if the arrow has sufficient data, `false` otherwise.
	 */
	public validateArrowDataForPositioning(arrow: ArrowData | null): boolean {
		if (!arrow) {
            // if (this.debug) console.log('📉 ValidationService (validateArrow): Fail - Arrow is null.');
            return false;
        }

        const hasMotionType = !!arrow.motionType;
        const hasStartOri = !!arrow.startOri;
        // Turns can be 0, so check for undefined/null explicitly if needed, or just existence.
        const hasTurns = typeof arrow.turns === 'number'; // Allow 0 turns
        // propRotDir might be optional depending on arrow type, adjust as needed
        const hasPropRotDir = !!arrow.propRotDir;

        const isValid = hasMotionType && hasStartOri && hasTurns // && hasPropRotDir; // Uncomment if propRotDir is strictly required

        // if (this.debug && !isValid) {
        //     console.log(`📉 ValidationService (validateArrow ${arrow.color}): Fail - Missing properties. Type:${hasMotionType}, Ori:${hasStartOri}, Turns:${hasTurns}, RotDir:${hasPropRotDir}`);
        // } else if (this.debug && isValid) {
        //      console.log(`📈 ValidationService (validateArrow ${arrow.color}): Pass - Required properties present.`);
        // }

		return isValid;
	}

    /**
     * Validates if the core `PictographData` input itself is sufficient
     * to even *begin* the initialization process (used by Initializer).
     *
     * @param pictograph - The input PictographData.
     * @returns `true` if sufficient to start initialization, `false` otherwise.
     */
    public validateInitialData(pictograph: PictographData | null): boolean {
        if (!pictograph) {
            if (this.debug) console.log('📉 ValidationService (validateInitial): Fail - Pictograph data is null.');
            return false;
        }
        if (!pictograph.redMotionData || !pictograph.blueMotionData) {
             if (this.debug) console.log('📉 ValidationService (validateInitial): Fail - Missing red or blue motion data.');
            return false;
        }
        // Add more checks if letter, startPos, etc., are mandatory inputs
        if (this.debug) console.log('📈 ValidationService (validateInitial): Pass - Core motion data present.');
        return true;
    }
}