import { MotionChecker } from './MotionChecker';
import { MotionOriCalculator } from './MotionOriCalculator';
import { HandpathCalculator as HandRotDirCalculator } from './HandpathCalculator';
import Prop from '../Prop/Prop.svelte';
import type { PictographInterface } from '../../../types/PictographInterface';
import { LeadStateDeterminer } from './LeadStateDeterminer';
import type {
	Color,
	HandRotDir,
	LeadState,
	Loc,
	MotionType,
	Orientation,
	PropRotDir,
	TKATurns
} from '../types/Types';
import type { MotionInterface } from './MotionInterface';
import type { PropInterface } from '../Prop/PropInterface';
import type { ArrowInterface } from '../Arrow/ArrowInterface';

export class Motion implements MotionInterface {
	motionType: MotionType;
	startLoc: Loc;
	endLoc: Loc;
	startOri: Orientation;
	propRotDir: PropRotDir;
	color: Color;
	turns: TKATurns;
	leadState: LeadState;
	prefloatMotionType: MotionType | null = null;
	prefloatPropRotDir: PropRotDir | null = null;
	endOri: Orientation = 'in';
	handRotDir: HandRotDir = null;
	pictographData: PictographInterface;
	motionData: MotionInterface;
	prop: PropInterface | null = null;
	arrow: ArrowInterface | null = null;

	checker: MotionChecker;
	oriCalculator: MotionOriCalculator;
	handRotDirCalculator: HandRotDirCalculator;

	constructor(pictographData: PictographInterface, motionData: MotionInterface) {
		// log the motion data
		this.motionData = motionData;
		this.pictographData = pictographData;
		this.motionData.pictographData = pictographData;
		this.motionType = motionData.motionType;
		this.startLoc = motionData.startLoc;
		this.endLoc = motionData.endLoc;
		this.startOri = motionData.startOri;
		this.propRotDir = motionData.propRotDir;
		this.color = motionData.color;
		this.turns = motionData.turns;
		this.leadState = motionData.leadState;
		this.prefloatMotionType = motionData.prefloatMotionType;
		this.prefloatPropRotDir = motionData.prefloatPropRotDir;

		this.checker = new MotionChecker(this);
		this.oriCalculator = new MotionOriCalculator(this);
		this.handRotDirCalculator = new HandRotDirCalculator();

		this.motionData.endOri = this.oriCalculator.calculateEndOri();
		this.validatePrefloatProperties();
	}

	assignLeadStates(): void {
		const redMotionData = this.pictographData.redMotionData;
		const blueMotionData = this.pictographData.blueMotionData;

		if (redMotionData && blueMotionData) {
			const leadStateDeterminer = new LeadStateDeterminer(redMotionData, blueMotionData);
			const leadingMotion = leadStateDeterminer.getLeadingMotion();
			const trailingMotion = leadStateDeterminer.getTrailingMotion();

			leadingMotion.leadState = 'leading';
			trailingMotion.leadState = 'trailing';
		} else {
			throw new Error('Red or Blue motion data is null');
		}
	}

	attachComponents(prop: PropInterface, arrow: ArrowInterface): void {
		this.prop = prop;
		this.arrow = arrow;
	}

	private validatePrefloatProperties(): void {
		if (this.prefloatMotionType === 'float') {
			throw new Error("`prefloatMotionType` cannot be 'float'");
		}
		if (this.prefloatPropRotDir === 'no_rot') {
			throw new Error("`prefloatPropRotDir` cannot be 'no_rot'");
		}
	}
}
