import Arrow from '../Arrow.svelte';

export default class ShiftLocationCalculator {
    arrow: Arrow;
    pictograph: any;

    constructor(arrow: Arrow) {
        this.arrow = arrow;
    }

    calculateLocation() {
        const directionPairs: { [key: string]: string } = {
            n_e: 'ne',
            e_s: 'se',
            s_w: 'sw',
            w_n: 'nw',
            ne_nw: 'n',
            ne_se: 'e',
            sw_se: 's',
            nw_sw: 'w'
        };

        const key = `${this.arrow.motion.startLoc}_${this.arrow.motion.endLoc}`;
        const location = directionPairs[key] || '';
        console.log('Calculated Location:', location);
        return location;
    }
}
