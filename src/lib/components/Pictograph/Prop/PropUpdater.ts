import PropAttrManager from './PropAttrManager';
import PropRotAngleManager from './PropRotAngleManager';
import PropSvgManager from './PropSvgManager';

export default class PropUpdater {
	attrManager: PropAttrManager;
	rotAngleManager: PropRotAngleManager;
	svgManager: PropSvgManager;

	constructor(
		attrManager: PropAttrManager,
		rotAngleManager: PropRotAngleManager,
		svgManager: PropSvgManager
	) {
		this.attrManager = attrManager;
		this.rotAngleManager = rotAngleManager;
		this.svgManager = svgManager;
	}

	update(attributes: Partial<PropAttrManager>): void {
		this.attrManager.updateAttributes(attributes);
		this.rotAngleManager.getRotationAngle();
		this.svgManager.getSvgPath(this.attrManager.propType, this.attrManager.color);
	}
}
