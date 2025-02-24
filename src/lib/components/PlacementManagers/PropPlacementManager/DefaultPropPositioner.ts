// src/lib/components/Prop/PropPlacementManager/DefaultPropPositioner.ts

import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { GridPoint } from '$lib/components/objects/Grid/GridPoint';
import type { PropData } from '$lib/components/objects/Prop/PropData';

export class DefaultPropPositioner {
	constructor(
		private gridData: GridData,
		private gridMode: string
	) {}

	public async setToDefaultPosition(propData: PropData): Promise<void> {
		this.updateCoords(propData);
	}

	public updateCoords(prop: PropData): void {
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
