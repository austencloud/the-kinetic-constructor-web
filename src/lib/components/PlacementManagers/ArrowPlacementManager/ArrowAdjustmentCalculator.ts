// src/lib/components/PlacementManagers/ArrowPlacementManager/ArrowAdjustmentCalculator.ts
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { DefaultArrowPositioner } from './DefaultArrowPositioner';
import { QuadrantIndexHandler } from './QuadrantIndexHandler';
import { DirectionalTupleManager } from './DirectionalTupleManager';
import type { PictographData } from '$lib/types/PictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { Motion } from '$lib/components/objects/Motion/Motion';

export class ArrowAdjustmentCalculator {
    private quadrantIndexHandler: QuadrantIndexHandler;

    constructor(
        private defaultPositioner: DefaultArrowPositioner,
        private pictographData: PictographData,
        private gridData: GridData
    ) {
        this.quadrantIndexHandler = new QuadrantIndexHandler(pictographData, gridData);
    }

    public getAdjustment(arrow: ArrowData): { x: number; y: number } {
        if (!this.pictographData.letter) {
            return { x: 0, y: 0 };
        }
        
        // Get default adjustment values
        const [x, y] = this.defaultPositioner.getDefaultAdjustment(arrow);
        
        // Find the corresponding motion based on the arrow's color
        const motion = this.getMotionForArrow(arrow);
        if (!motion) {
            return { x, y }; // Return default adjustment if no motion found
        }
        
        // Generate directional tuples from the motion data
        const dtManager = new DirectionalTupleManager(motion);
        const directionalAdjustments = dtManager.generateDirectionalTuples(x, y);
        
        if (!directionalAdjustments || directionalAdjustments.length === 0) {
            return { x, y }; // Return default adjustment if no directional adjustments
        }
        
        // Get the quadrant index to select the correct adjustment
        const quadrantIndex = this.quadrantIndexHandler.getQuadrantIndex(arrow);
        if (quadrantIndex < 0 || quadrantIndex >= directionalAdjustments.length) {
            return { x: 0, y: 0 }; // Return zero adjustment for invalid indices
        }

        // Apply the selected adjustment
        const [adjX, adjY] = directionalAdjustments[quadrantIndex];
        return { x: adjX, y: adjY };
    }
    
    // Helper method to get the corresponding motion object for an arrow
    private getMotionForArrow(arrow: ArrowData): Motion | null {
        if (arrow.color === 'red' && this.pictographData.redMotion) {
            return this.pictographData.redMotion;
        } else if (arrow.color === 'blue' && this.pictographData.blueMotion) {
            return this.pictographData.blueMotion;
        }
        return null;
    }
}