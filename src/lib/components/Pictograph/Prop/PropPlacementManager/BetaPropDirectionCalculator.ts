// BetaPropDirectionCalculator.ts

import type { Color, Direction } from '../../Motion/MotionInterface';
import type { BoxLocation, DiamondLocation, PropInterface } from '../PropInterface';
import type { Location } from '../../Prop/PropInterface';
import type { PictographInterface } from '$lib/types/PictographInterface';
import { Letter } from '$lib/types/Letter';
export class BetaPropDirectionCalculator {
	// Special case maps for Letter I
	private directionMapRadialI: Record<Location, Record<Color, Direction>> = {
		n: { red: 'right', blue: 'left' },
		e: { red: 'down', blue: 'up' },
		s: { red: 'left', blue: 'right' },
		w: { red: 'down', blue: 'up' },
		ne: { red: 'downright', blue: 'upleft' },
		se: { red: 'upright', blue: 'downleft' },
		sw: { red: 'downright', blue: 'upleft' },
		nw: { red: 'upright', blue: 'downleft' }
	};

	private directionMapNonRadialI: Record<Location, Record<Color, Direction>> = {
		n: { red: 'up', blue: 'down' },
		e: { red: 'right', blue: 'left' },
		s: { red: 'down', blue: 'up' },
		w: { red: 'right', blue: 'left' },
		ne: { red: 'upright', blue: 'downleft' },
		se: { red: 'downright', blue: 'upleft' },
		sw: { red: 'upright', blue: 'downleft' },
		nw: { red: 'downright', blue: 'upleft' }
	};

	// Shift direction maps
	private directionMapRadialShift: Record<Location, Partial<Record<Location, Direction>>> = {
		e: { n: 'right', s: 'right' },
		w: { n: 'left', s: 'left' },
		n: { e: 'up', w: 'up' },
		s: { e: 'down', w: 'down' },
		ne: { nw: 'upright', se: 'upright' },
		se: { ne: 'downright', sw: 'downright' },
		sw: { nw: 'downleft', se: 'downleft' },
		nw: { ne: 'upleft', sw: 'upleft' }
	};

	private directionMapNonRadialShift: Record<Location, Partial<Record<Location, Direction>>> = {
		e: { n: 'up', s: 'up' },
		w: { n: 'down', s: 'down' },
		n: { e: 'right', w: 'right' },
		s: { e: 'left', w: 'left' },
		ne: { se: 'upleft', nw: 'downright' },
		se: { ne: 'upright', sw: 'downleft' },
		sw: { nw: 'upright', se: 'downright' },
		nw: { sw: 'upleft', ne: 'downleft' }
	};

	// Static/dash maps
	private diamondMapRadial: Record<DiamondLocation, Record<Color, Direction>> = {
		n: { red: 'right', blue: 'left' },
		e: { red: 'down', blue: 'up' },
		s: { red: 'left', blue: 'right' },
		w: { red: 'down', blue: 'up' },
	};

	private diamondMapNonRadial: Record<DiamondLocation, Record<Color, Direction>> = {
		n: { red: 'up', blue: 'down' },
		e: { red: 'right', blue: 'left' },
		s: { red: 'down', blue: 'up' },
		w: { red: 'right', blue: 'left' },

	};

	private boxMapRadial: Record<BoxLocation, Record<Color, Direction>> = {
		ne: { red: 'downright', blue: 'upleft' },
		se: { red: 'upright', blue: 'downleft' },
		sw: { red: 'downright', blue: 'upleft' },
		nw: { red: 'upright', blue: 'downleft' },
	};

	private boxMapNonRadial: Record<BoxLocation, Record<Color, Direction>> = {
		ne: { red: 'upright', blue: 'downleft' },
		se: { red: 'downright', blue: 'upleft' },
		sw: { red: 'upright', blue: 'downleft' },
		nw: { red: 'downright', blue: 'upleft' },
	};

	constructor(private pictographData: PictographInterface) {}

	getDirection(prop: PropInterface): Direction | undefined {
		if (['pro', 'anti', 'float'].includes(prop.motion.motionType)) {
			return this.handleShiftMotion(prop);
		}
		return this.handleStaticDashMotion(prop);
	}
	endsWithRadialOrientation(): boolean {
		return (
			((this.pictographData.redMotionData?.endOri === 'in' ||
				this.pictographData.redMotionData?.endOri === 'out') &&
				this.pictographData.blueMotionData?.endOri === 'in') ||
			this.pictographData.blueMotionData?.endOri === 'out'
		);
	}
	endsWithNonRadialOrientation(): boolean {
		return (
			((this.pictographData.redMotionData?.endOri === 'clock' ||
				this.pictographData.redMotionData?.endOri === 'counter') &&
				this.pictographData.blueMotionData?.endOri === 'clock') ||
			this.pictographData.blueMotionData?.endOri === 'counter'
		);
	}
	private handleShiftMotion(prop: PropInterface): Direction | undefined {
		if (this.pictographData.letter === Letter.I) {
			if (this.endsWithRadialOrientation()) {
				return this.directionMapRadialI[prop.motion.endLoc][prop.color];
			}
			if (this.endsWithNonRadialOrientation()) {
				return this.directionMapNonRadialI[prop.motion.endLoc][prop.color];
			}
		}

		const isRadial = prop.radialMode === 'radial';
		return this.getShiftDirection(isRadial, prop.motion.startLoc, prop.motion.endLoc);
	}

	private getShiftDirection(
		isRadial: boolean,
		startLoc: Location,
		endLoc: Location
	): Direction | undefined {
		const map = isRadial ? this.directionMapRadialShift : this.directionMapNonRadialShift;
		return map[startLoc]?.[endLoc];
	}

	private handleStaticDashMotion(prop: PropInterface): Direction {
		const gridMode = ['n', 's', 'e', 'w'].includes(prop.loc) ? 'diamond' : 'box';
		const isRadial = prop.radialMode === 'radial';

		if (gridMode === 'diamond') {
			const map = isRadial ? this.diamondMapRadial : this.diamondMapNonRadial;
			return map[prop.loc as DiamondLocation][prop.color];
		}

		const map = isRadial ? this.boxMapRadial : this.boxMapNonRadial;
		return map[prop.loc as BoxLocation][prop.color];
	}

	getOppositeDirection(direction: Direction): Direction {
		const opposites: Record<Direction, Direction> = {
			up: 'down',
			down: 'up',
			left: 'right',
			right: 'left',
			upright: 'downleft',
			downleft: 'upright',
			upleft: 'downright',
			downright: 'upleft'
		};
		return opposites[direction];
	}
}
