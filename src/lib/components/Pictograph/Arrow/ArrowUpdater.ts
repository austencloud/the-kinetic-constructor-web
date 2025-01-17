class ArrowUpdater {
	attrHandler: ArrowAttrHandler;
	svgManager: ArrowSvgManager;
	mirrorManager: ArrowMirrorManager;

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
			mirrored: this.mirrorManager.updateMirror(),
		};
	}
}

