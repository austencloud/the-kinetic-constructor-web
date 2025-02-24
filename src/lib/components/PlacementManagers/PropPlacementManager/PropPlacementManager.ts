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

	constructor(
		pictographData: PictographData,
		gridData: GridData | null,
		checker: PictographChecker
	) {
		// if grid data is null when passed in, throw an error
		if (!gridData) {
			throw new Error('Grid data is required to initialize PropPlacementManager');
		}
		const gridMode = pictographData?.gridMode ?? 'diamond';
		this.defaultPositioner = new DefaultPropPositioner(gridData, gridMode);
		this.betaPositioner = new BetaPropPositioner(pictographData);
		this.checker = checker;
	}

	public updatePropPlacement(props: PropData[]): PropData[] {
		props.forEach((prop) => {
			this.defaultPositioner.setToDefaultPosition(prop);
			console.log(`📌 Default Positioner Set for ${prop.id}:`, prop.coords);
		});

		if (this.checker.endsWithBeta()) {
			this.betaPositioner.reposition(props);
			props.forEach((prop) => console.log(`🚀 Beta Positioner Set for ${prop.id}:`, prop.coords));
		}

		return props;
	}
}
