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
import type { Location } from '../Prop/PropInterface';

export class Motion implements MotionInterface {
	motionType: MotionType;
	startLoc: Location;
	endLoc: Location;
	startOri: Orientation;
	propRotDir: PropRotDir;
	color: Color;
	turns: number;
	leadState: LeadState;
	prefloatMotionType: MotionType | null = null;
	prefloatPropRotDir: PropRotDir | null = null;
	endOri: Orientation = 'in';
	handRotDir: HandRotDir = 'cw_handpath';
	pictographData: PictographInterface;

	prop: Prop | null = null;
	arrow: Arrow | null = null;

	checker: MotionChecker;
	oriCalculator: MotionOriCalculator;
	updater: MotionUpdater;
	handRotDirCalculator: HandRotDirCalculator;

	constructor(motionData: MotionInterface) {
		const {
			pictographData,
			motionType = 'static',
			startLoc = 'n',
			endLoc = 'n',
			startOri = 'in',
			propRotDir = 'no_rot',
			color = 'blue',
			turns = 0,
			leadState = 'trailing',
			prefloatMotionType = null,
			prefloatPropRotDir = null,
			arrow,
			prop
		} = motionData;

		this.pictographData = pictographData;
		this.motionType = motionType;
		this.startLoc = startLoc;
		this.endLoc = endLoc;
		this.startOri = startOri;
		this.propRotDir = propRotDir;
		this.color = color;
		this.turns = turns;
		this.leadState = leadState;
		this.prefloatMotionType = prefloatMotionType;
		this.prefloatPropRotDir = prefloatPropRotDir;

		this.arrow = arrow || null;
		this.prop = prop || null;

		this.checker = new MotionChecker(this);
		this.oriCalculator = new MotionOriCalculator(this);
		this.updater = new MotionUpdater(this);
		this.handRotDirCalculator = new HandRotDirCalculator();

		this.endOri = this.oriCalculator.calculateEndOri();
		this.validatePrefloatProperties();
	}

	updateMotionData(newData: Partial<MotionInterface>): void {
		Object.assign(this, newData);
		this.endOri = this.oriCalculator.calculateEndOri();
	}

	updateAttributes(attributes: Partial<MotionInterface>): void {
		Object.assign(this, attributes);

		if (this.prefloatMotionType === 'float') {
			throw new Error("`prefloatMotionType` cannot be 'float'");
		}
		if (this.prefloatPropRotDir === 'no_rot') {
			throw new Error("`prefloatPropRotDir` cannot be 'no_rot'");
		}
	}

	getAttributes(): Record<string, any> {
		return {
			motionType: this.motionType,
			startLoc: this.startLoc,
			endLoc: this.endLoc,
			startOri: this.startOri,
			endOri: this.endOri,
			propRotDir: this.propRotDir,
			color: this.color,
			turns: this.turns
		};
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
