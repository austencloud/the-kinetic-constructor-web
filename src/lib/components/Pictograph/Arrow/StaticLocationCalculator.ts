import Arrow from './Arrow.svelte';

export default class StaticLocationCalculator {
    arrow: Arrow;

    constructor(arrow: Arrow) {
        this.arrow = arrow;
    }

    calculateLocation() {
        return this.arrow.motion.startLoc; // Return the arrow's starting location
    }
}
