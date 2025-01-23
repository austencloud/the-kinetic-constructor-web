import ArrowSvgManager from './ArrowSvgManager';
import ArrowMirrorManager from './ArrowMirrorManager';
import type { ArrowInterface } from './ArrowInterface';

class ArrowUpdater {
	private svgManager: ArrowSvgManager;
	private mirrorManager: ArrowMirrorManager;

	constructor(private arrowData: ArrowInterface) {
		this.svgManager = new ArrowSvgManager(arrowData);
		this.mirrorManager = new ArrowMirrorManager(arrowData);
	}

	updateArrow() {
		return {
			svgPath: this.svgManager.getSvgPath(),
			mirrored: this.mirrorManager.updateMirror()
		};
	}
}

export default ArrowUpdater;