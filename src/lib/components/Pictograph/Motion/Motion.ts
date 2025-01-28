import { MotionChecker } from './MotionChecker';
import { MotionOriCalculator } from './MotionOriCalculator';
import { HandpathCalculator as HandRotDirCalculator } from './HandpathCalculator';
import Prop from '../Prop/Prop.svelte';
import type { PictographData } from '../../../types/PictographData';
import { LeadStateDeterminer } from './LeadStateDeterminer';
import type {
	Color,
	GridMode,
	HandRotDir,
	LeadState,
	Loc,
	MotionType,
	Orientation,
	PropRotDir,
	TKATurns
} from '../types/Types';
import type { MotionData } from './MotionData';
import type { PropData } from '../Prop/PropData';
import type { ArrowData } from '../Arrow/ArrowData';
import type { Letter } from '$lib/types/Letter';
import { LetterUtils } from '../LetterUtils';

export class Motion implements MotionData {
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
	motionData: MotionData;
	prop: PropData | null = null;
	arrow: ArrowData | null = null;
	gridMode: GridMode;
	checker: MotionChecker;
	oriCalculator: MotionOriCalculator;
	handRotDirCalculator: HandRotDirCalculator;
	redMotionData: MotionData;
	blueMotionData: MotionData;
	letter: Letter;
	public readonly ready: Promise<void>;

	constructor(pictographData: PictographData, motionData: MotionData) {
		this.ready = new Promise((resolve, reject) => {
			try {
				// Move constructor logic here
				resolve();
			} catch (error) {
				reject(error);
			}
		}); // log the motion data
		if (pictographData.redMotionData && pictographData.blueMotionData) {
			this.redMotionData = pictographData.redMotionData;
			this.blueMotionData = pictographData.blueMotionData;
		} else {
			throw new Error('Red or Blue motion data is null');
		}
		if (pictographData.letter === null) {
			throw new Error('Letter is null');
		}

		this.motionData = motionData;
		this.letter = LetterUtils.getLetter(pictographData.letter);

		this.motionType = motionData.motionType;
		this.gridMode = pictographData.gridMode;
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
		const redMotionData = this.redMotionData;
		const blueMotionData = this.blueMotionData;

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

	attachComponents(prop: PropData, arrow: ArrowData): void {
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
