import Arrow from '../Arrow.svelte';

export default class DashLocationCalculator {
    arrow: Arrow;
    pictograph: any;

    constructor(arrow: Arrow, pictograph: any) {
        this.arrow = arrow;
        this.pictograph = pictograph;
    }

    calculateLocation(): string {
        if (['Φ_DASH', 'Ψ_DASH'].includes(this.pictograph.letter)) {
            return this._getPhiDashPsiDashLocation();
        }

        if (['Λ', 'Λ_DASH'].includes(this.pictograph.letter) && this.arrow.motion.turns === 0) {
            return this._getLambdaZeroTurnsLocation();
        }

        if (this.arrow.motion.turns === 0) {
            return this._defaultZeroTurnsDashLocation();
        }

        return this._dashLocationNonZeroTurns();
    }

    private _getPhiDashPsiDashLocation(): string {
        const otherMotion = this.pictograph.getOtherMotion(this.arrow.motion);

        if (this.arrow.motion.turns === 0 && otherMotion.turns === 0) {
            const locationMap: { [key: string]: string } = {
                RED_NORTH_SOUTH: 'se',
                RED_EAST_WEST: 'ne',
                BLUE_NORTH_SOUTH: 'nw',
                BLUE_EAST_WEST: 'sw'
            };

            const key = `${this.arrow.color}_${this.arrow.motion.startLoc}_${this.arrow.motion.endLoc}`;
            return locationMap[key] || '';
        }

        if (this.arrow.motion.turns === 0) {
            return this.pictograph.getOppositeLocation(this._dashLocationNonZeroTurns(otherMotion));
        }

        return this._dashLocationNonZeroTurns(this.arrow.motion);
    }

    private _getLambdaZeroTurnsLocation(): string {
        const otherMotion = this.pictograph.getOtherMotion(this.arrow.motion);
        const locMap: { [key: string]: string } = {
            NORTH_SOUTH_WEST: 'se',
            EAST_WEST_SOUTH: 'ne'
        };

        const key = `${this.arrow.motion.startLoc}_${this.arrow.motion.endLoc}_${otherMotion.endLoc}`;
        return locMap[key] || '';
    }

    private _defaultZeroTurnsDashLocation(): string {
        const locationMap: { [key: string]: string } = {
            NORTH_SOUTH: 'se',
            EAST_WEST: 'sw'
        };

        const key = `${this.arrow.motion.startLoc}_${this.arrow.motion.endLoc}`;
        return locationMap[key] || '';
    }

    private _dashLocationNonZeroTurns(motion = this.arrow.motion): string {
        const locMap: { [key: string]: { [key: string]: string } } = {
            CLOCKWISE: {
                NORTH: 'se',
                EAST: 'sw'
            },
            COUNTER_CLOCKWISE: {
                NORTH: 'nw',
                EAST: 'ne'
            }
        };

        return locMap[motion.propRotDir]?.[motion.startLoc] || '';
    }
}
