import type { ArrowInterface } from '../../ArrowInterface';
import type { Loc } from '../../../Prop/PropInterface';
import type Prop from '../Prop/Prop.svelte';
import type { PropRotDir } from '../../../Motion/MotionInterface';
// Ensure Location does not include null

export default class DashRotAngleCalculator {
	private noRotationMap: Record<Loc, number> = {
		n: 90,
		s: 270,
		e: 180,
		w: 0,
		ne: 45,
		se: 135,
		sw: 225,
		nw: 315
	};

	private orientationRotationMapCW: Record<Loc, number> = {
		n: 0,
		e: 90,
		s: 180,
		w: 270,
		ne: 45,
		se: 135,
		sw: 225,
		nw: 315
	};

	private orientationRotationMapCCW: Record<Loc, number> = {
		n: 0,
		e: 270,
		s: 180,
		w: 90,
		ne: 315,
		se: 225,
		sw: 135,
		nw: 45
	};

	public calculate(loc: Loc, propRotDir: PropRotDir): number {
		if (propRotDir === 'no_rot') {
			return this.noRotationMap[loc] ?? 0;
		}

		const orientationMap =
			propRotDir === 'cw' ? this.orientationRotationMapCW : this.orientationRotationMapCCW;

		return orientationMap[loc] ?? 0;
	}
}
