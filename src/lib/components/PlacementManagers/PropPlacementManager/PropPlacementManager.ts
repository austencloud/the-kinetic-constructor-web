// PropPlacementManager.ts
import { DefaultPropPositioner } from './DefaultPropPositioner';
import { BetaPropPositioner } from './BetaPropPositioner';
import type { PictographData } from '$lib/types/PictographData';
import type { PictographChecker } from '$lib/components/Pictograph/PictographChecker';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';

export class PropPlacementManager {
    public defaultPositioner: DefaultPropPositioner;
    private betaPositioner: BetaPropPositioner;
    private checker: PictographChecker;
    public ready: Promise<void>;
    private resolveReady!: () => void;
    private rejectReady!: (reason?: any) => void;

    constructor(
        pictographData: PictographData,
        gridData: GridData | null,
        checker: PictographChecker
    ) {
        // if grid data is null when passed in, throw an error
        if (!gridData) {
            console.error('❌ PropPlacementManager: No grid data provided');
            throw new Error('Grid data is required to initialize PropPlacementManager');
        }
        
        const gridMode = pictographData?.gridMode ?? 'diamond';
        console.log(`🏗️ PropPlacementManager: Creating with grid mode ${gridMode}`);
        
        this.ready = new Promise<void>((resolve, reject) => {
            this.resolveReady = resolve;
            this.rejectReady = reject;
        });
        
        try {
            this.defaultPositioner = new DefaultPropPositioner(gridData, gridMode);
            this.betaPositioner = new BetaPropPositioner(pictographData);
            this.checker = checker;
            
            // Log the available grid points
            console.log(`📊 PropPlacementManager: Init with ${
                Object.keys(gridData.allHandPointsNormal || {}).length
            } normal hand points`);
            
            // Initialize is complete
            this.resolveReady();
        } catch (error) {
            console.error('❌ PropPlacementManager: Initialization failed', error);
            this.rejectReady(error);
            throw error;
        }
    }

    public updatePropPlacement(props: PropData[]): PropData[] {
        console.log(`🔄 PropPlacementManager: Updating placement for ${props.length} props`);
        
        if (!props.length) {
            console.warn('⚠️ PropPlacementManager: No props provided to updatePropPlacement');
            return props;
        }
        
        // Log the props before positioning for debugging
        props.forEach(prop => {
            console.log(`📊 Before positioning: ${prop.color} prop at (${prop.coords.x}, ${prop.coords.y}), loc=${prop.loc}`);
        });
        
        // Apply default positioning
        props.forEach((prop) => {
            if (!prop.loc) {
                console.error(`❌ PropPlacementManager: Prop missing location data:`, prop.id);
                return;
            }
            
            this.defaultPositioner.setToDefaultPosition(prop);
            console.log(`📌 Default Positioner Set for ${prop.id} at (${prop.coords.x}, ${prop.coords.y})`);
        });

        // Apply beta positioning if needed
        if (this.checker.endsWithBeta()) {
            console.log("🔄 Applying beta positioning adjustments");
            this.betaPositioner.reposition(props);
            props.forEach((prop) => console.log(`🚀 Beta Positioner Set for ${prop.id} at (${prop.coords.x}, ${prop.coords.y})`));
        }

        // Validate positions
        this.validatePropPositions(props);

        return props;
    }
    
    private validatePropPositions(props: PropData[]): void {
        const invalidProps = props.filter(p => 
            !p.coords || (p.coords.x === 0 && p.coords.y === 0)
        );
        
        if (invalidProps.length > 0) {
            console.error(`❌ PropPlacementManager: ${invalidProps.length} props still at (0,0) after placement`);
            
            // Fix any invalid positions with fallback
            invalidProps.forEach(prop => {
                console.log(`🔧 Fixing invalid position for ${prop.color} prop`);
                prop.coords = { x: 475, y: 475 }; // Center fallback
            });
        } else {
            console.log('✅ PropPlacementManager: All props successfully positioned');
        }
    }
}