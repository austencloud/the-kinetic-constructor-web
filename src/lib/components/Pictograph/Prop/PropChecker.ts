import type PropAttrManager from './PropAttrManager';

export default class PropChecker {
	attrManager: PropAttrManager;

	constructor(attrManager: PropAttrManager) {
		this.attrManager = attrManager;
	}

	isRadial(): boolean {
		return ['in', 'out'].includes(this.attrManager.orientation);
	}

	isNonRadial(): boolean {
		return ['clock', 'counter'].includes(this.attrManager.orientation);
	}
	
	hasOutOrientation(): boolean {
		return this.attrManager.orientation === 'out';
	}

	hasInOrientation(): boolean {
		return this.attrManager.orientation === 'in';
	}

	hasClockOrientation(): boolean {
		return this.attrManager.orientation === 'clock';
	}

	hasCounterOrientation(): boolean {
		return this.attrManager.orientation === 'counter';
	}
}
