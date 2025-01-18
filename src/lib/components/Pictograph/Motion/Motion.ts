import { MotionChecker } from './MotionChecker';
import { MotionOriCalculator } from './MotionOriCalculator';
import { MotionUpdater } from './MotionUpdater';
import { MotionAttrManager } from './MotionAttrManager';
import type {
	MotionInterface,
	MotionType,
	PropRotDir,
	Location,
	Color,
	LeadState,
	Orientation,
	HandRotDir
} from '../types/MotionTypes';
import Prop from '../Prop/Prop.svelte';
import Arrow from '../Arrow/Arrow.svelte';
import Pictograph from '../Pictograph.svelte';

import { HandpathCalculator } from './HandpathCalculator';

export class Motion {
	motionType = 'static';
	startLoc = 'n';
	endLoc = 'n';
	propRotDir = 'no_rot';
	color = 'blue';
	turns = 0;
	leadState = 'trailing';
	startOri = 'in';
	handRotDir = 'cw';
	arrow = null;
	prop = null;
	prefloatMotionType = null;
	prefloatPropRotDir = null;
	checker = new MotionChecker(this);
	oriCalculator = new MotionOriCalculator(this);
	updater = new MotionUpdater(this);
	attrManager = new MotionAttrManager(this);
	handRotDirCalculator = new HandpathCalculator();

	constructor(
		public pictograph: any,
		motionData: Partial<MotionInterface>
	) {
		Object.assign(this, motionData);
		this.pictograph = pictograph;

		this.motionType = motionData.motionType || 'static';
		this.startLoc = motionData.startLoc || 'n';
		this.endLoc = motionData.endLoc || 'n';
		this.propRotDir = motionData.propRotDir || 'no_rot';
		this.color = motionData.color || 'blue';
		this.arrow = null;
		this.prop = null;
		this.turns = motionData.turns || 0;
		this.leadState = motionData.leadState || 'trailing';
		this.handRotDir = motionData.handRotDir || 'cw'; // or any default value that fits your logic

		// Validate prefloat properties
		if (this.prefloatMotionType === 'float') {
			throw new Error("`prefloatMotionType` cannot be 'float'");
		}
		if (this.prefloatPropRotDir === 'no_rot') {
			throw new Error("`prefloatPropRotDir` cannot be 'no_rot'");
		}
		this.checker = new MotionChecker(this);
		this.oriCalculator = new MotionOriCalculator(this);
		this.updater = new MotionUpdater(this);
		this.attrManager = new MotionAttrManager(this);
	}
}
