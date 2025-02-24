import { writable, type Writable } from 'svelte/store';
import type { GridData } from '../objects/Grid/GridData';
import type { Motion } from '../objects/Motion/Motion';
import type { ArrowData } from '../objects/Arrow/ArrowData';
import type { PropData } from '../objects/Prop/PropData';

export function createPictographElements() {
    return {
        gridData: writable<GridData | null>(null),

        // Props (Flattened - No nested store)
        redPropData: writable<PropData | null>(null),
        bluePropData: writable<PropData | null>(null),

        // Arrows (Flattened - No nested store)
        redArrowData: writable<ArrowData | null>(null),
        blueArrowData: writable<ArrowData | null>(null),

        // Motions
        redMotion: writable<Motion | null>(null),
        blueMotion: writable<Motion | null>(null)
    };
}
