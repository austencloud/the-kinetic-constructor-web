import type { PropInterface } from '../PropInterface';
import { DefaultPropPositioner } from './DefaultPropPositioner';
import { BetaPropPositioner } from './BetaPropPositioner';
import type { GridData } from '../../Grid/GridInterface';
import type { PictographInterface } from '$lib/types/PictographInterface';

export class PropPlacementManager {
	private defaultPositioner: DefaultPropPositioner;
	private betaPositioner: BetaPropPositioner;

	constructor(
		private pictographData: PictographInterface,
		private gridData: GridData,
		private gridWidth: number,
		private gridHeight: number
	) {
		const gridMode = this.pictographData?.gridMode ?? 'diamond';
		if (!this.gridData) {
			console.error('Grid data is missing.');
		}
		this.defaultPositioner = new DefaultPropPositioner(gridData, gridMode, gridWidth, gridHeight);
		this.betaPositioner = new BetaPropPositioner();
	}

	public updatePropPositions(props: PropInterface[]): PropInterface[] {
		console.debug('Updating Prop Positions:', props);
	
		return props.map((prop) => {
			if (!prop.motion?.pictographData?.gridMode) {
				console.warn('Prop has missing motion or gridMode:', prop);
				return prop;
			}
	
			if (prop.motion.pictographData.gridMode === 'diamond') {
				this.betaPositioner.reposition(props);
			} else {
				this.defaultPositioner.setToDefaultPosition(prop);
			}
			return prop; // Ensure updated coordinates are returned
		});
	}
	
}
