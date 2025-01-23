import { CLOCK, COUNTER, IN, OUT } from "$lib/types/Constants";
import type { PropInterface } from "./PropInterface";

class PropChecker {
	prop: PropInterface;

	constructor(propData: PropInterface) {
		this.prop = propData;
	}

	isRadial(): boolean {
		return [IN, OUT].includes(this.prop.ori);
	}

	isNonRadial(): boolean {
		return [CLOCK, COUNTER].includes(this.prop.ori);
	}

	hasOutOri(): boolean {
		return this.prop.ori === OUT;
	}

	hasInOri(): boolean {
		return this.prop.ori === IN;
	}

	hasClockOri(): boolean {
		return this.prop.ori === CLOCK;
	}

	hasCounterOri(): boolean {
		return this.prop.ori === COUNTER;
	}
}

export { PropChecker };
