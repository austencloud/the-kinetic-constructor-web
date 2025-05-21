import type { PictographData } from '$lib/types/PictographData';
import type { SequenceBeat } from '$lib/services/SequenceDataService';
import type {
    Color,
    MotionType,
    Orientation,
    PropRotDir,
    Loc,
    TKATurns,
    VTGTiming,
    VTGDir
} from '$lib/types/Types';
import type { TKAPosition } from '$lib/types/TKAPosition';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';

/**
 * Safely cast a string to a TKAPosition
 * Returns null if the value isn't a valid TKAPosition
 */
export function safeAsTKAPosition(value: string | undefined): TKAPosition | null {
    // This regex validates alpha1-8, beta1-8, gamma1-16
    const validPattern = /^(alpha[1-8]|beta[1-8]|gamma([1-9]|1[0-6]))$/;

    if (!value || !validPattern.test(value)) {
        return null;
    }

    return value as TKAPosition;
}

/**
 * Check if a string is a valid MotionType
 */
export function isValidMotionType(value: string): value is MotionType {
    return ['anti', 'pro', 'static', 'dash', 'float'].includes(value);
}

/**
 * Check if a string is a valid Orientation
 */
export function isValidOrientation(value: string): value is Orientation {
    return ['in', 'out', 'clock', 'counter'].includes(value);
}

/**
 * Check if a string is a valid PropRotDir
 */
export function isValidPropRotDir(value: string): value is PropRotDir {
    return ['cw', 'ccw', 'no_rot'].includes(value);
}

/**
 * Check if a string is a valid Loc
 */
export function isValidLoc(value: string): value is Loc {
    return ['n', 's', 'e', 'w', 'ne', 'se', 'sw', 'nw'].includes(value);
}

/**
 * Safely convert a value to TKATurns
 */
export function safeAsTKATurns(value: number | string | undefined): TKATurns {
    if (value === 'fl') return 'fl';
    const num = typeof value === 'number' ? value : parseFloat(value || '0');

    if ([0, 0.5, 1, 1.5, 2, 2.5, 3].includes(num)) {
        return num as TKATurns;
    }
    return 0;
}

/**
 * Safely convert a SequenceBeat to a PictographData
 */
export function sequenceBeatToPictographData(beat: SequenceBeat): PictographData {
    // Create a motion data object with proper type casting
    const createMotionData = (attrs: any): MotionData | null => {
        if (!attrs) return null;

        return {
            id: `motion-${Math.random().toString(36).substring(2, 11)}`,
            motionType: isValidMotionType(attrs.motion_type) ? attrs.motion_type : 'static',
            startOri: isValidOrientation(attrs.start_ori) ? attrs.start_ori : 'in',
            endOri: isValidOrientation(attrs.end_ori || attrs.start_ori)
                ? attrs.end_ori || attrs.start_ori
                : 'in',
            propRotDir: isValidPropRotDir(attrs.prop_rot_dir) ? attrs.prop_rot_dir : 'no_rot',
            startLoc: isValidLoc(attrs.start_loc) ? attrs.start_loc : 's',
            endLoc: isValidLoc(attrs.end_loc) ? attrs.end_loc : 's',
            turns: safeAsTKATurns(attrs.turns),
            color: 'blue' as Color, // Will be overridden below
            leadState: null,
            prefloatMotionType: null,
            prefloatPropRotDir: null
        };
    };

    // Create blue and red motion data
    const blueMotionData = createMotionData(beat.blue_attributes);
    const redMotionData = createMotionData(beat.red_attributes);

    // Set colors
    if (blueMotionData) blueMotionData.color = 'blue';
    if (redMotionData) redMotionData.color = 'red';

    // Create and return the PictographData
    return {
        letter: null, // Not using this for options
        startPos: safeAsTKAPosition(beat.start_pos),
        endPos: safeAsTKAPosition(beat.end_pos),
        timing: (beat.timing as VTGTiming) || null,
        direction: (beat.direction as VTGDir) || null,
        gridMode: 'diamond',
        gridData: null,
        blueMotionData,
        redMotionData,
        redPropData: null,
        bluePropData: null,
        redArrowData: null,
        blueArrowData: null,
        grid: 'diamond'
    };
}
