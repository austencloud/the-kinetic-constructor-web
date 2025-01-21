import type { PropInterface } from '../PropInterface';
import { DefaultPropPositioner } from './DefaultPropPositioner';
import type { GridData } from '../../Grid/GridInterface';
import type { PictographInterface } from '$lib/types/PictographInterface';

export class PropPlacementManager {
	private defaultPositioner: DefaultPropPositioner;

	constructor(
		private pictographData: PictographInterface,
		private gridData: GridData,
	) {
		const gridMode = this.pictographData?.gridMode ?? 'diamond';
		if (!this.gridData) {
			console.error('Grid data is missing.');
		}
		this.defaultPositioner = new DefaultPropPositioner(gridData, gridMode);
	}

	public updatePropPositions(props: PropInterface[]): PropInterface[] {
		console.debug('Updating Prop Positions', props.map(p => p.propType));
		return props.map((prop) => {
			this.defaultPositioner.setToDefaultPosition(prop);
			return prop;
		});
	}
	
}
