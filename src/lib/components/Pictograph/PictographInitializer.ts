import { get, writable, type Writable } from 'svelte/store';
import { createPictographElements } from './PictographElements';
import { Motion } from '../objects/Motion/Motion';
import { createPropData } from '../objects/Prop/PropFactory';
import { createArrowData } from '../objects/Arrow/ArrowFactory';
import type { PictographData } from '$lib/types/PictographData';
import type { ArrowData } from '../objects/Arrow/ArrowData';

export class PictographInitializer {
    elements: Writable<ReturnType<typeof createPictographElements>>;
    pictographDataStore: Writable<PictographData>;
    ready: Promise<void>;
    private resolveReady!: () => void;

    constructor(pictographDataStore: Writable<PictographData>) {
        this.elements = writable(createPictographElements());
        this.pictographDataStore = pictographDataStore;
        
        // Create a promise to track when initialization is complete
        this.ready = new Promise<void>((resolve) => {
            this.resolveReady = resolve;
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

            // Use Promise.all for parallel processing where possible
            const [redMotion, blueMotion] = await this.createMotions(pictograph);
            
            const [propResults, arrowResults] = await Promise.all([
                this.createProps(redMotion, blueMotion),
                this.createArrows(redMotion, blueMotion)
            ]);
            
            const [redProp, blueProp] = propResults;
            const [redArrow, blueArrow] = arrowResults;

            this.updateElementsStore(redProp, blueProp, redArrow, blueArrow, redMotion, blueMotion);
            
            console.log('✅ Pictograph Initialization Complete');
            this.resolveReady(); // Resolve the ready promise
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.resolveReady(); // Resolve even on error, to avoid deadlocking UI
            throw error;
        }
    }

    private async createMotions(pictograph: PictographData): Promise<[Motion, Motion]> {
        console.log('🔄 Creating Motions...');
        const redMotion = new Motion(pictograph, pictograph.redMotionData!);
        const blueMotion = new Motion(pictograph, pictograph.blueMotionData!);
        await Promise.all([redMotion.ready, blueMotion.ready]);
        console.log('✅ Motions Created');
        return [redMotion, blueMotion];
    }

    private async createProps(redMotion: Motion, blueMotion: Motion): Promise<[any, any]> {
        console.log('🔄 Creating Props...');
        const [redProp, blueProp] = await Promise.all([
            createPropData(redMotion),
            createPropData(blueMotion)
        ]);
        console.log('✅ Props Created');
        return [redProp, blueProp];
    }

    private async createArrows(redMotion: Motion, blueMotion: Motion): Promise<[any, any]> {
        console.log('🔄 Creating Arrows...');
        const [redArrow, blueArrow] = await Promise.all([
            createArrowData(redMotion),
            createArrowData(blueMotion)
        ]);
        console.log('✅ Arrows Created');
        return [redArrow, blueArrow];
    }

    private updateElementsStore(
        redProp: any,
        blueProp: any,
        redArrow: any,
        blueArrow: any,
        redMotion: Motion,
        blueMotion: Motion
    ) {
        this.elements.update((els) => {
            els.redPropData.set({ ...redProp, motionId: redMotion.id });
            els.bluePropData.set({ ...blueProp, motionId: blueMotion.id });

            els.redArrowData.set({
                ...redArrow,
                motionId: redMotion.id,
                motionType: redMotion.motionType,
                startOri: redMotion.startOri,
                turns: redMotion.turns,
                propRotDir: redMotion.propRotDir
            });

            els.blueArrowData.set({
                ...blueArrow,
                motionId: blueMotion.id,
                motionType: blueMotion.motionType,
                startOri: blueMotion.startOri,
                turns: blueMotion.turns,
                propRotDir: blueMotion.propRotDir
            });

            return els;
        });
    }
}