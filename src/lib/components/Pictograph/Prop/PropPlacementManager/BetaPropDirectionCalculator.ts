import type {
	Color,
	Direction,
	MotionInterface as Motion,
	Location
} from '../../Motion/MotionInterface';
import Prop from '../Prop.svelte';

export class BetaPropDirectionCalculator {
	private directionMapRadial = {
		n: { red: 'right', blue: 'left' },
		e: { red: 'down', blue: 'up' },
		s: { red: 'left', blue: 'right' },
		w: { red: 'down', blue: 'up' },
		ne: { red: 'downright', blue: 'upleft' },
		se: { red: 'upright', blue: 'downleft' },
		sw: { red: 'downright', blue: 'upleft' },
		nw: { red: 'upright', blue: 'downleft' }
	};

	private directionMapNonRadial = {
		n: { red: 'up', blue: 'down' },
		e: { red: 'right', blue: 'left' },
		s: { red: 'down', blue: 'up' },
		w: { red: 'right', blue: 'left' },
		ne: { red: 'upright', blue: 'downleft' },
		se: { red: 'downright', blue: 'upleft' },
		sw: { red: 'upright', blue: 'downleft' },
		nw: { red: 'downright', blue: 'upleft' }
	};

	private directionMapRadialShift = {
		e: { n: 'right', s: 'right' },
		w: { n: 'left', s: 'left' },
		n: { e: 'up', w: 'up' },
		s: { e: 'down', w: 'down' },
		ne: { nw: 'upright', se: 'upright' },
		se: { ne: 'downright', sw: 'downright' },
		sw: { nw: 'downleft', se: 'downleft' },
		nw: { ne: 'upleft', sw: 'upleft' }
	};

	private directionMapNonRadialShift = {
		e: { n: 'up', s: 'up' },
		w: { n: 'down', s: 'down' },
		n: { e: 'right', w: 'right' },
		s: { e: 'left', w: 'left' },
		ne: { se: 'upleft', nw: 'downright' },
		se: { ne: 'upright', sw: 'upright' },
		sw: { nw: 'upleft', se: 'downright' },
		nw: { ne: 'downleft', sw: 'downleft' }
	};

	public getDirection(
		isRadial: boolean,
		location: keyof typeof this.directionMapRadial,
		color: Color
	): Direction | undefined {
		const map = isRadial ? this.directionMapRadial : this.directionMapNonRadial;
		return (map?.[location]?.[color] as Direction) ?? undefined;
	}

	public getShiftDirection(
		isRadial: boolean,
		startLocation: keyof typeof this.directionMapRadialShift,
		endLocation: keyof typeof this.directionMapRadialShift.e
	): Direction | undefined {
		const map = isRadial ? this.directionMapRadialShift : this.directionMapNonRadialShift;
		return (map[startLocation] as Record<string, Direction>)?.[endLocation];
	}

	public getOppositeDirection(direction: Direction): Direction {
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

	public getDir(motion: Motion): Direction | undefined {
		if (
			(motion.pictographData.redMotionData?.endOri === 'in' &&
				motion.pictographData.blueMotionData?.endOri === 'in') ||
			(motion.pictographData.redMotionData?.endOri === 'out' &&
				motion.pictographData.blueMotionData?.endOri === 'out') ||
			(motion.pictographData.redMotionData?.endOri === 'in' &&
				motion.pictographData.blueMotionData?.endOri === 'out') ||
			(motion.pictographData.redMotionData?.endOri === 'out' &&
				motion.pictographData.blueMotionData?.endOri === 'in')
		) {
			return this.getDirectionForRadialI(motion);
		} else if (
			(motion.pictographData.redMotionData?.endOri === 'clock' &&
				motion.pictographData.blueMotionData?.endOri === 'clock') ||
			(motion.pictographData.redMotionData?.endOri === 'counter' &&
				motion.pictographData.blueMotionData?.endOri === 'counter') ||
			(motion.pictographData.redMotionData?.endOri === 'clock' &&
				motion.pictographData.blueMotionData?.endOri === 'counter') ||
			(motion.pictographData.redMotionData?.endOri === 'counter' &&
				motion.pictographData.blueMotionData?.endOri === 'clock')
		) {
			return this.getDirectionForNonRadialI(motion);
		}
		if (
			motion.motionType === 'pro' ||
			motion.motionType === 'anti' ||
			motion.motionType === 'float'
		) {
			return motion.prop?.propType === 'radial'
				? this.getDirForRadial(motion)
				: this.getDirForNonRadial(motion);
		} else if (motion.motionType === 'static' || motion.motionType === 'dash') {
			if (motion.prop) {
				return this.getDirForNonShift(motion.prop);
			} else {
				throw new Error('Prop is undefined for a static or dash motion type.');
			}
		}
	}

	private getDirectionForNonRadialI(motion: Motion): Direction | undefined {
		return this.getDirection(false, motion.endLoc, motion.prop?.color || 'red');
	}

	private getDirectionForRadialI(motion: Motion): Direction | undefined {
		return this.getDirection(true, motion.endLoc, motion.prop?.color || 'red');
	}

	private getDirForRadial(motion: Motion): Direction | undefined {
		if (this.isValidRadialShiftLocation(motion.endLoc)) {
			return this.getShiftDirection(true, motion.startLoc, motion.endLoc);
		}
		throw new Error(`Invalid end location for radial shift: ${motion.endLoc}`);
	}

	private getDirForNonRadial(motion: Motion): Direction | undefined {
		if (this.isValidRadialShiftLocation(motion.endLoc)) {
			return this.getShiftDirection(false, motion.startLoc, motion.endLoc);
		}
		throw new Error(`Invalid end location for non-radial shift: ${motion.endLoc}`);
	}

	private getDirForNonShift(prop: Prop): Direction {
		const gridMode = ['n', 's', 'e', 'w'].includes(prop.loc) ? 'diamond' : 'box';
		const map =
			gridMode === 'diamond'
				? prop.propType === 'radial'
					? this.directionMapRadial
					: this.directionMapNonRadial
				: prop.propType === 'radial'
					? this.directionMapRadialShift
					: this.directionMapNonRadialShift;

		return (map[prop.loc as keyof typeof map] as Record<Color, Direction>)[prop.color as Color];
	}
	private isValidRadialShiftLocation(
		loc: Location
	): loc is keyof typeof this.directionMapRadialShift.e {
		return ['n', 's'].includes(loc);
	}
}
