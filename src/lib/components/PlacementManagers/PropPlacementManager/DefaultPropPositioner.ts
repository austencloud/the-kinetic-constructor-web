// src/lib/components/PlacementManagers/PropPlacementManager/DefaultPropPositioner.ts
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { GridPoint } from '$lib/components/objects/Grid/GridPoint';
import type { PropData } from '$lib/components/objects/Prop/PropData';

export class DefaultPropPositioner {
    private debugMode: boolean = true;
    private fallbackCoordinates: Record<string, { x: number, y: number }> = {
        // Default positions if grid points aren't found
        n: { x: 475, y: 330 },
        e: { x: 620, y: 475 },
        s: { x: 475, y: 620 },
        w: { x: 330, y: 475 },
        ne: { x: 620, y: 330 },
        se: { x: 620, y: 620 },
        sw: { x: 330, y: 620 },
        nw: { x: 330, y: 330 }
    };

    constructor(
        private gridData: GridData,
        private gridMode: string
    ) {
        // Validate grid data on initialization
        if (!gridData || !gridData.allHandPointsNormal) {
            console.error('❌ Invalid grid data provided to DefaultPropPositioner');
            throw new Error('Invalid grid data provided to DefaultPropPositioner');
        }
        
        if (this.debugMode) {
            console.log(`🏗️ DefaultPropPositioner created with grid mode: ${gridMode}`);
            console.log(`📊 Available grid points: ${Object.keys(gridData.allHandPointsNormal).length}`);
        }
    }

    public async setToDefaultPosition(propData: PropData): Promise<void> {
        // Basic validation
        if (!propData || !propData.loc) {
            console.error('❌ Invalid prop data for positioning:', propData);
            return;
        }
        
        if (this.debugMode) {
            console.log(`🎯 Setting default position for ${propData.color} prop at ${propData.loc}`);
        }
        
        this.updateCoords(propData);
    }

    public updateCoords(prop: PropData): void {
        const pointName = `${prop.loc}_${this.gridMode}_hand_point`;
        
        if (this.debugMode) {
            console.log(`🔍 Looking for grid point: "${pointName}" for ${prop.color} prop`);
        }

        // Try to get grid point from normal points
        const gridPoint = this.getGridPoint(pointName);
        
        if (gridPoint && gridPoint.coordinates) {
            prop.coords = gridPoint.coordinates;
            
            if (this.debugMode) {
                console.log(`✅ Found grid point "${pointName}": (${gridPoint.coordinates.x}, ${gridPoint.coordinates.y})`);
            }
        } else {
            // Use fallback if grid point not found
            const fallback = this.getFallbackCoordinates(prop.loc);
            prop.coords = fallback;
            
            console.warn(`⚠️ Grid point "${pointName}" not found for ${prop.color} prop. Using fallback: (${fallback.x}, ${fallback.y})`);
            
            // Log available grid points to help diagnose the issue
            if (this.debugMode) {
                const availablePoints = Object.keys(this.gridData.allHandPointsNormal)
                    .filter(key => key.includes(this.gridMode) && key.includes('hand_point'))
                    .slice(0, 5);
                console.log('Sample available grid points:', availablePoints);
            }
        }
    }

    private getGridPoint(pointName: string): GridPoint | undefined {
        // Try normal points first, then strict
        const normalPoint = this.gridData.allHandPointsNormal[pointName];
        const strictPoint = this.gridData.allHandPointsStrict[pointName];
        
        return normalPoint || strictPoint;
    }
    
    private getFallbackCoordinates(loc: string): { x: number, y: number } {
        if (this.fallbackCoordinates[loc]) {
            return this.fallbackCoordinates[loc];
        }
        
        // If even the fallback isn't available, use center of grid
        if (this.gridData.centerPoint && this.gridData.centerPoint.coordinates) {
            return this.gridData.centerPoint.coordinates;
        }
        
        // Absolute last resort
        return { x: 475, y: 475 };
    }
}