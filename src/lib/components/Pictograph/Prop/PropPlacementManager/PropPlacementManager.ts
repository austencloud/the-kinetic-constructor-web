// PropPlacementManager.ts
import { DefaultPropPositioner } from './DefaultPropPositioner';
import { BetaPropPositioner } from './BetaPropPositioner';
import type { GridData } from '../../Grid/GridInterface';
import type { PictographInterface } from '$lib/types/PictographInterface';
import { PictographChecker } from '../../PictographChecker';
import type { PropInterface } from '../PropInterface';

export class PropPlacementManager {
	public defaultPositioner: DefaultPropPositioner;
	private betaPositioner: BetaPropPositioner;
	private checker: PictographChecker;

	constructor(pictographData: PictographInterface, gridData: GridData, checker: PictographChecker) {
		const gridMode = pictographData?.gridMode ?? 'diamond';
		this.defaultPositioner = new DefaultPropPositioner(gridData, gridMode);
		this.betaPositioner = new BetaPropPositioner(pictographData);
		this.checker = checker;
	}

	public updatePropPlacement(props: PropInterface[]): PropInterface[] {
		props.forEach((prop) => {
			this.defaultPositioner.setToDefaultPosition(prop);
		});
		if (this.checker.endsWithBeta()) {
			this.betaPositioner.reposition(props);
		}

		return props;
	}
}
