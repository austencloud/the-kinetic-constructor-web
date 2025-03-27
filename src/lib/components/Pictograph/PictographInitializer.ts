import { get, writable, type Writable } from 'svelte/store';
import { createPictographElements } from './PictographElements';
import { Motion } from '../objects/Motion/Motion';
import { createPropData } from '../objects/Prop/PropFactory';
import { createArrowData } from '../objects/Arrow/ArrowFactory';
import type { PictographData } from '$lib/types/PictographData';
import type { ArrowData } from '../objects/Arrow/ArrowData';
import type { PropData } from '../objects/Prop/PropData';

export class PictographInitializer {
    elements: Writable<ReturnType<typeof createPictographElements>>;
    pictographDataStore: Writable<PictographData>;
    ready: Promise<void>;
    private resolveReady!: () => void;
    private rejectReady!: (reason?: any) => void;
    private components: {
        motions: { red?: Motion; blue?: Motion };
        props: { red?: PropData; blue?: PropData };
        arrows: { red?: ArrowData; blue?: ArrowData };
    };

    constructor(pictographDataStore: Writable<PictographData>) {
        this.elements = writable(createPictographElements());
        this.pictographDataStore = pictographDataStore;
        this.components = {
            motions: {},
            props: {},
            arrows: {}
        };
        
        // Create a promise to track when initialization is complete
        this.ready = new Promise<void>((resolve, reject) => {
            this.resolveReady = resolve;
            this.rejectReady = reject;
        });
    }

    async initialize() {
        try {
            console.log('🔄 Starting Pictograph Initialization...');
            const pictograph: PictographData = get(this.pictographDataStore);
            console.log('🔥 Initializing Pictograph:', pictograph);

            if (!pictograph.letter) {
                console.warn('⚠️ No letter provided in pictograph data. Aborting initialization.');
                this.resolveReady(); // Resolve promise even on warning
                return;
            }

            // Create and wait for motions to be ready
            await this.createAndStoreMotions(pictograph);
            
            // Create props and arrows in parallel
            await Promise.all([
                this.createAndStoreProps(),
                this.createAndStoreArrows()
            ]);
            
            // Update the elements store with all components
            this.updateElementsStore();
            
            console.log('✅ Pictograph Initialization Complete');
            this.resolveReady(); // Resolve the ready promise
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.rejectReady(error); // Reject with error
            throw error;
        }
    }

    private async createAndStoreMotions(pictograph: PictographData): Promise<void> {
        console.log('🔄 Creating Motions...');
        
        try {
            const redMotion = new Motion(pictograph, pictograph.redMotionData!);
            const blueMotion = new Motion(pictograph, pictograph.blueMotionData!);
            
            // Wait for motion initialization to complete
            await Promise.all([redMotion.ready, blueMotion.ready]);
            
            // Store the motions
            this.components.motions.red = redMotion;
            this.components.motions.blue = blueMotion;
            
            console.log('✅ Motions Created and Ready');
        } catch (error) {
            console.error('❌ Motion creation failed:', error);
            throw error;
        }
    }

    private async createAndStoreProps(): Promise<void> {
        console.log('🔄 Creating Props...');
        
        if (!this.components.motions.red || !this.components.motions.blue) {
            throw new Error('Cannot create props: Motions not initialized');
        }
        
        try {
            const [redProp, blueProp] = await Promise.all([
                createPropData(this.components.motions.red),
                createPropData(this.components.motions.blue)
            ]);
            
            this.components.props.red = redProp;
            this.components.props.blue = blueProp;
            
            console.log('✅ Props Created and Ready');
        } catch (error) {
            console.error('❌ Prop creation failed:', error);
            throw error;
        }
    }

    private async createAndStoreArrows(): Promise<void> {
        console.log('🔄 Creating Arrows...');
        
        if (!this.components.motions.red || !this.components.motions.blue) {
            throw new Error('Cannot create arrows: Motions not initialized');
        }
        
        try {
            const [redArrow, blueArrow] = await Promise.all([
                createArrowData(this.components.motions.red),
                createArrowData(this.components.motions.blue)
            ]);
            
            this.components.arrows.red = redArrow;
            this.components.arrows.blue = blueArrow;
            
            console.log('✅ Arrows Created and Ready');
        } catch (error) {
            console.error('❌ Arrow creation failed:', error);
            throw error;
        }
    }

    private updateElementsStore() {
        console.log('🔄 Updating Elements Store...');
        
        if (!this.components.props.red || !this.components.props.blue || 
            !this.components.arrows.red || !this.components.arrows.blue || 
            !this.components.motions.red || !this.components.motions.blue) {
            throw new Error('Cannot update elements store: Missing components');
        }
        
        this.elements.update((els) => {
            els.redPropData.set({ 
                ...this.components.props.red!, 
                motionId: this.components.motions.red!.id 
            });
            
            els.bluePropData.set({ 
                ...this.components.props.blue!, 
                motionId: this.components.motions.blue!.id 
            });

            els.redArrowData.set({
                ...this.components.arrows.red!,
                motionId: this.components.motions.red!.id,
                motionType: this.components.motions.red!.motionType,
                startOri: this.components.motions.red!.startOri,
                turns: this.components.motions.red!.turns,
                propRotDir: this.components.motions.red!.propRotDir
            });

            els.blueArrowData.set({
                ...this.components.arrows.blue!,
                motionId: this.components.motions.blue!.id,
                motionType: this.components.motions.blue!.motionType,
                startOri: this.components.motions.blue!.startOri,
                turns: this.components.motions.blue!.turns,
                propRotDir: this.components.motions.blue!.propRotDir
            });
            
            els.redMotion.set(this.components.motions.red!);
            els.blueMotion.set(this.components.motions.blue!);

            return els;
        });
        
        console.log('✅ Elements Store Updated');
    }
}