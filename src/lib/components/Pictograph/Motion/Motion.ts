import type {
	MotionInterface,
	MotionType,
	PropRotDir,
	Location,
	Orientation,
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
	pictograph: Pictograph;

	arrow: Arrow | null = null;
	prop: Prop | null = null;

	checker: MotionChecker;
	oriCalculator: MotionOriCalculator;
	updater: MotionUpdater;
	handRotDirCalculator: HandRotDirCalculator;

	constructor(motionData: MotionInterface) {
		const {
			pictograph,
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

		this.pictograph = pictograph;
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

		this.calculateEndOrientation(); // Calculate end orientation on instantiation
		this.validatePrefloatProperties();
	}

	updateMotionData(newData: Partial<MotionInterface>): void {
		// Update motion properties
		Object.assign(this, newData);

		// Recalculate end orientation
		this.calculateEndOrientation();
	}

	/**
	 * Update motion attributes directly.
	 */
	updateAttributes(attributes: Partial<MotionInterface>): void {
		Object.assign(this, attributes);

		if (this.prefloatMotionType === 'float') {
			throw new Error("`prefloatMotionType` cannot be 'float'");
		}
		if (this.prefloatPropRotDir === 'no_rot') {
			throw new Error("`prefloatPropRotDir` cannot be 'no_rot'");
		}
	}

	/**
	 * Retrieve motion attributes as an object.
	 */
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

	/**
	 * Assign lead and trailing states.
	 */
	assignLeadStates(): void {
		const leadingMotion = this.pictograph.getLeadingMotion();
		const trailingMotion = this.pictograph.getTrailingMotion();
		if (leadingMotion && trailingMotion) {
			leadingMotion.leadState = 'leading';
			trailingMotion.leadState = 'trailing';
		}
	}

	private calculateEndOrientation(): void {
		this.endOri = this.oriCalculator.calculateEndOri();
	}

	attachComponents(arrow: Arrow, prop: Prop): void {
		this.arrow = arrow;
		this.prop = prop;

		// Reverse relationships
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
