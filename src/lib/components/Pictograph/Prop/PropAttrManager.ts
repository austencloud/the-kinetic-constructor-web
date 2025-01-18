import type { Orientation } from "./PropTypes";

export default class PropAttrManager {
	propType: string;
	color: 'red' | 'blue';
	location: string;
	orientation: string;
	size: { width: number; height: number };

	constructor({ propType, color, location, orientation, size }: any) {
		this.propType = propType;
		this.color = color;
		this.location = location;
		this.orientation = orientation;
		this.size = size;
	}

	updateAttributes(attributes: Partial<PropAttrManager>): void {
		Object.assign(this, attributes);
	}

	clearAttributes(): void {
		this.propType = 'hand';
		this.color = 'blue';
		this.location = 'n';
		this.orientation = 'in';
	}

	getAttributes(): Record<string, any> {
		return {
			propType: this.propType,
			color: this.color,
			location: this.location,
			orientation: this.orientation,
			size: this.size
		};
	}
	swapOrientation(): void {
		const orientationMap: Record<Orientation, Orientation> = {
			in: 'out',
			out: 'in',
			clock: 'counter',
			counter: 'clock',
		};
		this.orientation = orientationMap[this.orientation as Orientation];
	}
	
	setZValueBasedOnColor(): number {
		return this.color === 'red' ? 5 : 4; // Mimicking Z-value logic from Python.
	}
}
