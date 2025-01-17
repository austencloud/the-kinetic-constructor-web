class ArrowSvgManager {
	constructor(private arrowProps: any) {}

	updateSvgAppearance() {
		// Emulates the SVG update by returning styles
		return {
			backgroundColor: this.arrowProps.color
		};
	}
}

