import type { Motion } from '../Motion/Motion';
import type { Color, Loc, Orientation, PropType, RadialMode } from '../../../types/Types';

export interface PropData {
    id: string;
    motionId: string; // ✅ Parent reference
    propType: PropType;
    color: Color;
    radialMode: RadialMode;
    ori: Orientation;
    coords: { x: number; y: number };
    loc: Loc;
    rotAngle: number;
    svgCenter: { x: number; y: number };
}
