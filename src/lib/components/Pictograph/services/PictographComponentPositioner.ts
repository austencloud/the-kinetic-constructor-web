import { get, type Writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import { PictographChecker } from '../PictographChecker';
import { ArrowPlacementManager } from '../../PlacementManagers/ArrowPlacementManager/ArrowPlacementManager';

export class PictographComponentPositioner {
    private arrowPlacementManager: ArrowPlacementManager | null = null;
    
    constructor(private pictographDataStore: Writable<PictographData>) {}

    positionProp(prop: PropData, gridData: GridData): void {
        const gridMode = get(this.pictographDataStore).gridMode;
        const pointName = `${prop.loc}_${gridMode}_hand_point`;

        if (gridData.allHandPointsNormal && gridData.allHandPointsNormal[pointName]?.coordinates) {
            prop.coords = { ...gridData.allHandPointsNormal[pointName].coordinates! };
        } else {
            this.applyFallbackPropPosition(prop);
        }
    }

    private getArrowPlacementManager(gridData: GridData): ArrowPlacementManager {
        if (!this.arrowPlacementManager) {
            const pictographData = get(this.pictographDataStore);
            const checker = new PictographChecker(pictographData);
            this.arrowPlacementManager = new ArrowPlacementManager(
                pictographData,
                gridData,
                checker
            );
        }
        return this.arrowPlacementManager;
    }

    positionArrows(redArrow: ArrowData, blueArrow: ArrowData, gridData: GridData, colorProp: PropData | null): void {
        
        let arrows = [redArrow, blueArrow];
        try {
            const manager = this.getArrowPlacementManager(gridData);
            manager.updateArrowPlacements(arrows);
        } catch (error) {
            console.warn('Arrow positioning error:', error);
        }
    }

    private applyFallbackPropPosition(prop: PropData): void {
        const basePositions: Record<string, { x: number; y: number }> = {
            n: { x: 475, y: 330 },
            e: { x: 620, y: 475 },
            s: { x: 475, y: 620 },
            w: { x: 330, y: 475 },
            ne: { x: 620, y: 330 },
            se: { x: 620, y: 620 },
            sw: { x: 330, y: 620 },
            nw: { x: 330, y: 330 }
        };

        if (prop.loc && basePositions[prop.loc]) {
            prop.coords = { ...basePositions[prop.loc] };
        } else {
            prop.coords = { x: 475, y: 475 };
        }
    }
}
