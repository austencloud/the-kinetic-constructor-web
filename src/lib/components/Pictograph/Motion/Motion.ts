import type {
	MotionInterface,
	MotionType,
	PropRotDir,
	Color,
	LeadState,
	HandRotDir,
	Orientation
} from './MotionInterface';
import { MotionChecker } from './MotionChecker';
import { MotionOriCalculator } from './MotionOriCalculator';
import { MotionUpdater } from './MotionUpdater';
import { HandpathCalculator as HandRotDirCalculator } from './HandpathCalculator';
import Arrow from '../Arrow/Arrow.svelte';
import Prop from '../Prop/Prop.svelte';
import type { PictographInterface } from '../../../types/PictographInterface';
import { LeadStateDeterminer } from './LeadStateDeterminer';
import type { Loc } from '../Prop/PropInterface';

export class Motion implements MotionInterface {
	motionType: MotionType;
	startLoc: Loc;
	endLoc: Loc;
	startOri: Orientation;
	propRotDir: PropRotDir;
	color: Color;
	turns: number;
	leadState: LeadState;
	prefloatMotionType: MotionType | null = null;
	prefloatPropRotDir: PropRotDir | null = null;
	endOri: Orientation = 'in';
	handRotDir: HandRotDir = null;
	pictographData: PictographInterface;
	motionData: MotionInterface;
	prop: Prop | null = null;
	arrow: Arrow | null = null;

	checker: MotionChecker;
	oriCalculator: MotionOriCalculator;
	updater: MotionUpdater;
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
		this.updater = new MotionUpdater(this);
		this.handRotDirCalculator = new HandRotDirCalculator();
		
		this.motionData.endOri = this.oriCalculator.calculateEndOri();
		console.log('motionData', motionData);
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

	attachComponents(prop: Prop, arrow: Arrow): void {
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
