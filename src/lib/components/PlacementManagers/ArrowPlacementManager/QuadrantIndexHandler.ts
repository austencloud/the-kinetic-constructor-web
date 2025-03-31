// src/lib/components/PlacementManagers/ArrowPlacementManager/QuadrantIndexHandler.ts
import type { PictographData } from '$lib/types/PictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';

export class QuadrantIndexHandler {
    private pictographData: PictographData;
    private gridData: GridData;

    constructor(pictographData: PictographData, gridData: GridData) {
        this.pictographData = pictographData;
        this.gridData = gridData;
    }

    public getQuadrantIndex(arrow: ArrowData): number {
        const gridMode = this.pictographData.gridMode || 'diamond';
        const motionType = arrow.motionType;

        if (gridMode === 'diamond') {
            if (['pro', 'anti', 'float'].includes(motionType)) {
                return this.diamondShiftQuadrantIndex(arrow.loc ?? '');
            } else if (['static', 'dash'].includes(motionType)) {
                return this.diamondStaticDashQuadrantIndex(arrow.loc ?? '');
            }
        } else if (gridMode === 'box') {
            if (['pro', 'anti', 'float'].includes(motionType)) {
                return this.boxShiftQuadrantIndex(arrow.loc ?? '');
            } else if (['static', 'dash'].includes(motionType)) {
                return this.boxStaticDashQuadrantIndex(arrow.loc ?? '');
            }
        }
        return 0;
    }

    private diamondShiftQuadrantIndex(location: string): number {
        switch (location) {
            case 'ne':
                return 0;
            case 'se':
                return 1;
            case 'sw':
                return 2;
            case 'nw':
                return 3;
            default:
                return 0;
        }
    }

    private diamondStaticDashQuadrantIndex(location: string): number {
        switch (location) {
            case 'n':
                return 0;
            case 'e':
                return 1;
            case 's':
                return 2;
            case 'w':
                return 3;
            default:
                return 0;
        }
    }

    private boxShiftQuadrantIndex(location: string): number {
        switch (location) {
            case 'n':
                return 0;
            case 'e':
                return 1;
            case 's':
                return 2;
            case 'w':
                return 3;
            default:
                return 0;
        }
    }

    private boxStaticDashQuadrantIndex(location: string): number {
        switch (location) {
            case 'ne':
                return 0;
            case 'se':
                return 1;
            case 'sw':
                return 2;
            case 'nw':
                return 3;
            default:
                return 0;
        }
    }
}