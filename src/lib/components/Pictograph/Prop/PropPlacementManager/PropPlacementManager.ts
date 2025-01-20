import type { PropInterface } from '../PropInterface';
import { DefaultPropPositioner } from './DefaultPropPositioner';
import { BetaPropPositioner } from './BetaPropPositioner';
import type { GridData } from '../../Grid/GridInterface';
import type { PictographInterface } from '$lib/types/PictographInterface';
import Prop from '../Prop.svelte';

export class PropPlacementManager {
	private defaultPositioner: DefaultPropPositioner;
	private betaPositioner: BetaPropPositioner;

	constructor(
		private pictographData: PictographInterface,
		gridData: GridData
	) {
		this.defaultPositioner = new DefaultPropPositioner(gridData);
		this.betaPositioner = new BetaPropPositioner();
	}

	public updatePropPositions(propDataSet: PropInterface[]): void {
		propDataSet.forEach((prop) => {
			if (prop.motion.pictographData.gridMode === 'diamond') {
				this.betaPositioner.reposition(propDataSet);
			} else {
				this.defaultPositioner.setToDefaultPosition(prop);
			}
		});
	}
}
