// src/lib/components/Prop/PropPlacementManager/DefaultPropPositioner.ts
import type { GridData, GridPoint } from '../../Grid/GridInterface';
import type { PropInterface } from '../PropInterface';
import type { PropType } from '../PropTypes';

export class DefaultPropPositioner {
	constructor(
		private gridData: GridData,
		private gridMode: string
	) {}

	public async setToDefaultPosition(propData: PropInterface): Promise<void> {
		this.updateCoords(propData);
	}

	public updateCoords(prop: PropInterface): void {
		const pointName = `${prop.loc}_${this.gridMode}_hand_point`;
		const gridPoint = this.getGridPoint(pointName);

		prop.coords = gridPoint?.coordinates || { x: 0, y: 0 };
	}


	private getGridPoint(pointName: string): GridPoint | undefined {
		return (
			this.gridData.allHandPointsNormal[pointName] || this.gridData.allHandPointsStrict[pointName]
		);
	}
}
