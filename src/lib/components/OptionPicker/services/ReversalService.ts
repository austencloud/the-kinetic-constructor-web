
// src/lib/components/OptionPicker/services/ReversalService.ts
import type { PictographData } from '$lib/types/PictographData';
import { NO_ROT } from '$lib/types/Constants';
import type { PropRotDir } from '$lib/types/Types';
import type { ReversalFilter } from '../stores/optionPickerStore';

export class ReversalService {
    /**
     * Determines the reversal category of an option relative to the sequence
     */
    static determineReversalCategory(
        sequence: PictographData[],
        option: PictographData
    ): Exclude<ReversalFilter, 'all'> {
        const blueContinuous = this.checkColorContinuity(sequence, option, 'blue');
        const redContinuous = this.checkColorContinuity(sequence, option, 'red');

        if (blueContinuous && redContinuous) return 'continuous';
        if (blueContinuous || redContinuous) return 'oneReversal';
        return 'twoReversals';
    }

    /**
     * Checks if the rotation direction for a specific color is continuous
     */
    private static checkColorContinuity(
        sequence: PictographData[],
        option: PictographData,
        color: 'blue' | 'red'
    ): boolean {
        const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';
        const lastRotation = this.findLastRotation(sequence, color);
        const currentRotation = option[motionDataKey]?.propRotDir ?? NO_ROT;

        return (
            lastRotation === NO_ROT || currentRotation === NO_ROT || lastRotation === currentRotation
        );
    }

    /**
     * Finds the last non-NO_ROT rotation direction for a color in the sequence
     */
    private static findLastRotation(sequence: PictographData[], color: 'blue' | 'red'): PropRotDir {
        const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';

        for (let i = sequence.length - 1; i >= 0; i--) {
            const rotation = sequence[i]?.[motionDataKey]?.propRotDir;
            if (rotation && rotation !== NO_ROT) {
                return rotation;
            }
        }
        return NO_ROT;
    }
}