import type {
	MotionInterface,
	MotionType,
	PropRotDir,
	Location,
	Color,
	LeadState,
	HandRotDir
} from './MotionInterface';
import { MotionChecker } from './MotionChecker';
import { MotionOriCalculator } from './MotionOriCalculator';
import { MotionUpdater } from './MotionUpdater';
import { HandpathCalculator as HandRotDirCalculator } from './HandpathCalculator';
import Arrow from '../Arrow/Arrow.svelte';
import Prop from '../Prop/Prop.svelte';
import Pictograph from '../Pictograph.svelte';
import type { Orientation } from '../Prop/PropTypes';
import type { PictographInterface } from '../../../types/PictographInterface';

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

	arrow: Arrow | null = null;
	prop: Prop | null = null;

	checker: MotionChecker;
	oriCalculator: MotionOriCalculator;
	updater: MotionUpdater;
	handRotDirCalculator: HandRotDirCalculator;

	constructor(motionData: MotionInterface) {
		const {
			pictographData: pictograph,
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

		this.pictographData = pictograph;
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

		// Initialize managers
		this.checker = new MotionChecker(this);
		this.oriCalculator = new MotionOriCalculator(this);
		this.updater = new MotionUpdater(this);
		this.handRotDirCalculator = new HandRotDirCalculator();

		// Calculate end orientation immediately
		this.calculateEndOrientation();
		this.validatePrefloatProperties();
	}

	private calculateEndOrientation(): void {
		this.endOri = this.oriCalculator.calculateEndOri();
	}

	updateMotionData(newData: Partial<MotionInterface>): void {
		Object.assign(this, newData);
		this.calculateEndOrientation();
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
		const motions = this.pictographData.motionData;

		if (motions?.length === 2) {
			// Assuming two motions: one red and one blue
			const [leadingMotion, trailingMotion] = motions;

			// Assign lead states
			leadingMotion.leadState = 'leading';
			trailingMotion.leadState = 'trailing';
		} else {
			console.warn('Unexpected number of motions in pictograph data:', motions);
		}
	}

	attachComponents(arrow: Arrow, prop: Prop): void {
		this.arrow = arrow;
		this.prop = prop;

		if (this.arrow) {
			this.arrow.motion = this;
		}
		if (this.prop) {
			this.prop.motion = this;
		}
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
