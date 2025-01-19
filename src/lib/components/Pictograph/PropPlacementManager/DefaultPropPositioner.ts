import type { PropInterface } from '../Prop/PropInterface';

export class DefaultPropPositioner {
	private defaultX = 100;
	private defaultY = 100;

	public setToDefaultPosition(propData: PropInterface): void {
		propData.coords = { x: this.defaultX, y: this.defaultY };
	}
}
