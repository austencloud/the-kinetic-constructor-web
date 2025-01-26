import type { Motion } from '../Motion/Motion';
import type { Color, Loc } from '../types/Types';

export interface ArrowInterface {
    color: Color;
    coords: { x: number; y: number };
    loc: Loc;
    rotAngle: number;
    mirrored: boolean;
    motion: Motion;
    svgCenter: { x: number; y: number };
}