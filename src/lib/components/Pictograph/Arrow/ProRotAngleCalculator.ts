import type { Location } from '../Prop/PropInterface';
import type { ArrowInterface } from './ArrowInterface';

export default class ProRotAngleCalculator {
	private directionMapCW: Record<Location, number> = {
		n: 315,
		e: 45,
		s: 135,
		w: 225,
		ne: 0,
		se: 90,
		sw: 180,
		nw: 270
	};

	private directionMapCCW: Record<Location, number> = {
		n: 315,
		e: 225,
		s: 135,
		w: 45,
		ne: 270,
		se: 180,
		sw: 90,
		nw: 0
	};

	public calculate(arrowData: ArrowInterface): number {
		const directionMap =
			arrowData.motion.propRotDir === 'cw' ? this.directionMapCW : this.directionMapCCW;
        const angle = directionMap[arrowData.loc as Location] ?? 0;
        console.log(`Arrow Location: ${arrowData.loc}, Direction: ${arrowData.motion.propRotDir}`);
        console.log(`Calculated angle: ${angle}`);
        return angle;
	}
}
