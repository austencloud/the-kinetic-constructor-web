type Motion = {
	type: 'pro' | 'anti' | 'dash' | 'static';
	startLoc: string;
	endLoc: string;
	propRotDir?: string;
};

export default class ArrowSvgManager {
	private motion: Motion;
	private color: string;

	constructor(arrowProps: { motion: Motion; color: string }) {
		this.motion = arrowProps.motion;
		this.color = arrowProps.color;
	}

	getSvgPath(): string {
		const basePath = '/assets/arrows';
		const typePath = this.motion.type.toLowerCase();
		const colorPath = this.color.toLowerCase();

		return `${basePath}/${typePath}/${colorPath}.svg`;
	}

	updateSvgAppearance(): { backgroundColor: string } {
		return { backgroundColor: this.color };
	}
}
