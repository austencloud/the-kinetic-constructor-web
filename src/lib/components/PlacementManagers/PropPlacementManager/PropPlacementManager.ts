// PropPlacementManager.ts
import { DefaultPropPositioner } from './DefaultPropPositioner';
import { BetaPropPositioner } from './BetaPropPositioner';
import type { PictographData } from '$lib/types/PictographData';
import type { PictographChecker } from '$lib/components/Pictograph/PictographChecker';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';

export class PropPlacementManager {
	public defaultPositioner: DefaultPropPositioner;
	private betaPositioner: BetaPropPositioner;
	private checker: PictographChecker;

	constructor(pictographData: PictographData, gridData: GridData, checker: PictographChecker) {
		const gridMode = pictographData?.gridMode ?? 'diamond';
		this.defaultPositioner = new DefaultPropPositioner(gridData, gridMode);
		this.betaPositioner = new BetaPropPositioner(pictographData);
		this.checker = checker;
	}

	public updatePropPlacement(props: PropData[]): PropData[] {
		props.forEach((prop) => {
			this.defaultPositioner.setToDefaultPosition(prop);
		});
		if (this.checker.endsWithBeta()) {
			this.betaPositioner.reposition(props);
		}

		return props;
	}
}
