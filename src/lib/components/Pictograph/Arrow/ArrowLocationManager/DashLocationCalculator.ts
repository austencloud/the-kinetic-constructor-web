import { Letter } from '$lib/types/Letter';
import type { Motion } from '../../Motion/Motion';
import type { PictographGetter } from '../../PictographGetter';
import Arrow from '../Arrow.svelte';

export default class DashLocationCalculator {
    private motion: Motion;
    private getter: PictographGetter;
  
    constructor(motion: Motion, getter: PictographGetter) {
      this.motion = motion;
      this.getter = getter;
    }
  
    calculateLocation(): string {
        if (this.motion.pictographData.letter && [Letter.Φ_DASH, Letter.Ψ_DASH].includes(this.motion.pictographData.letter)) {
            return this._getPhiDashPsiDashLocation();
        }

        if (this.motion.pictographData.letter && [Letter.Λ, Letter.Λ_DASH].includes(this.motion.pictographData.letter) && this.motion.turns === 0) {
            return this._getLambdaZeroTurnsLocation();
        }

        if (this.motion.turns === 0) {
            return this._defaultZeroTurnsDashLocation();
        }

        return this._dashLocationNonZeroTurns();
    }

    private _getPhiDashPsiDashLocation(): string {
        const otherMotion = this.getter.getOtherMotion(this.motion);

        if (this.motion.turns === 0 && otherMotion && otherMotion.turns === 0) {
            const locationMap: { [key: string]: string } = {
                RED_NORTH_SOUTH: 'se',
                RED_EAST_WEST: 'ne',
                BLUE_NORTH_SOUTH: 'nw',
                BLUE_EAST_WEST: 'sw'
            };

            const key = `${this.motion.color}_${this.motion.startLoc}_${this.motion.endLoc}`;
            return locationMap[key] || '';
        }

        if (this.motion.turns === 0) {
            return this.getter.getOppositeLocation(this._dashLocationNonZeroTurns(otherMotion ?? undefined)) ?? '';
        }

        return this._dashLocationNonZeroTurns(this.motion);
    }

    private _getLambdaZeroTurnsLocation(): string {
        const otherMotion = this.getter.getOtherMotion(this.motion);
        const locMap: { [key: string]: string } = {
            NORTH_SOUTH_WEST: 'se',
            EAST_WEST_SOUTH: 'ne'
        };

        const key = `${this.motion.startLoc}_${this.motion.endLoc}_${otherMotion?.endLoc ?? ''}`;
        return locMap[key] || '';
    }

    private _defaultZeroTurnsDashLocation(): string {
        const locationMap: { [key: string]: string } = {
            NORTH_SOUTH: 'se',
            EAST_WEST: 'sw'
        };

        const key = `${this.motion.startLoc}_${this.motion.endLoc}`;
        return locationMap[key] || '';
    }

    private _dashLocationNonZeroTurns(motion = this.motion): string {
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
