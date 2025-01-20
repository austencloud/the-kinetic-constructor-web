import Arrow from '../Arrow.svelte';

export default class ShiftLocationCalculator {
    arrow: Arrow;
    pictograph: any;

    constructor(arrow: Arrow) {
        this.arrow = arrow;
    }
    calculateLocation() {
        const directionPairs: { [key: string]: string } = {
            NORTH_EAST: 'ne',
            EAST_SOUTH: 'se',
            SOUTH_WEST: 'sw',
            WEST_NORTH: 'nw',
            NORTHEAST_NORTHWEST: 'n',
            NORTHEAST_SOUTHEAST: 'e',
            SOUTHWEST_SOUTHEAST: 's',
            NORTHWEST_SOUTHWEST: 'w'
        };

        const key = `${this.arrow.motion.startLoc}_${this.arrow.motion.endLoc}`;
        return directionPairs[key] || ''; // Return matching location or an empty string
    }
}
