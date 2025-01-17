class ArrowMirrorManager {
	constructor(private arrowProps: any) {}

	updateMirror() {
		return this.arrowProps.motion.propRotDir === 'clockwise' ? true : false;
	}
}
