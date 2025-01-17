import ArrowAttrHandler from './ArrowAttrHandler';
import ArrowSvgManager from './ArrowSvgManager';
import ArrowMirrorManager from './ArrowMirrorManager';

class ArrowUpdater {
	private attrHandler: ArrowAttrHandler;
	private svgManager: ArrowSvgManager;
	private mirrorManager: ArrowMirrorManager;

	constructor(arrowProps: any) {
		this.attrHandler = new ArrowAttrHandler(arrowProps);
		this.svgManager = new ArrowSvgManager(arrowProps);
		this.mirrorManager = new ArrowMirrorManager(arrowProps);
	}

	updateArrow(newAttributes?: any) {
		if (newAttributes) {
			this.attrHandler.updateAttributes(newAttributes);
		}

		return {
			svgStyles: this.svgManager.updateSvgAppearance(),
			svgPath: this.svgManager.getSvgPath(), // Centralized SVG Path
			mirrored: this.mirrorManager.updateMirror(),
		};
	}
}

export default ArrowUpdater;
