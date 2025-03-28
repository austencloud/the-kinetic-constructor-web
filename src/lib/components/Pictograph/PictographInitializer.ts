import { get, writable, type Writable } from 'svelte/store';
import { createPictographElements } from './PictographElements';
import { Motion } from '../objects/Motion/Motion';
import { createPropData } from '../objects/Prop/PropFactory';
import { createArrowData } from '../objects/Arrow/ArrowFactory';
import type { PictographData } from '$lib/types/PictographData';
import type { ArrowData } from '../objects/Arrow/ArrowData';
import type { PropData } from '../objects/Prop/PropData';

/**
 * PictographInitializer handles the creation and initialization of all pictograph components
 * It follows a structured sequence of initialization steps and manages component dependencies
 */
export class PictographInitializer {
    elements: Writable<ReturnType<typeof createPictographElements>>;
    pictographDataStore: Writable<PictographData>;
    ready: Promise<void>;
    public resolveReady!: () => void;
    private rejectReady!: (reason?: any) => void;
    private components: {
        motions: { red?: Motion; blue?: Motion };
        props: { red?: PropData; blue?: PropData };
        arrows: { red?: ArrowData; blue?: ArrowData };
    };
    private initialized: boolean = false;
    private debugMode: boolean = true;

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
	public hasIncompleteData: boolean = false;

    /**
     * Initialize all pictograph components in the correct sequence
     */
    async initialize(): Promise<void> {
		if (this.initialized) {
			console.log('Initializer already completed');
			return;
		}
	
		try {
			const pictograph: PictographData = get(this.pictographDataStore);
			
			// Step 1: Validate input data
			const isComplete = this.validatePictographData(pictograph);
			
			// Handle incomplete data case - early completion
			if (!isComplete) {
				console.log('Pictograph has incomplete data - finalizing with grid only');
				this.hasIncompleteData = true; // Set the flag to indicate incomplete data
				this.initialized = true;
				this.resolveReady();
				return;
			}
            
            // Proceed with complete data initialization
            // Step 2: Create and initialize motions
            await this.createAndStoreMotions(pictograph);
            
            // Step 3: Create props and arrows in parallel
            await this.createComponentsInParallel();
            
            // Step 4: Update element stores with created components
            this.updateElementsStore();
            
            // Mark initialization as complete
            this.initialized = true;
            this.resolveReady();
        } catch (error) {
            this.handleInitializationError(error);
        }
    }

    /**
     * Validate that the pictograph data contains the necessary information
     * @returns boolean indicating if the data is complete enough to proceed
     */
    private validatePictographData(pictograph: PictographData): boolean {
        let isComplete = true;
        
        if (!pictograph.letter) {
            console.warn('Initializing pictograph without a letter');
            // Letter can be optional
        }
        
        if (!pictograph.redMotionData || !pictograph.blueMotionData) {
            console.warn('Pictograph has incomplete motion data - will render grid only');
            isComplete = false;
        }
        
        return isComplete;
    }

    /**
     * Create both motions from pictograph data
     */
    private async createAndStoreMotions(pictograph: PictographData): Promise<void> {
        try {
            // Generate unique IDs for motions if they don't exist
            if (pictograph.redMotionData && !pictograph.redMotionData.id) {
                pictograph.redMotionData.id = crypto.randomUUID();
            }
            if (pictograph.blueMotionData && !pictograph.blueMotionData.id) {
                pictograph.blueMotionData.id = crypto.randomUUID();
            }

            if (!pictograph.redMotionData || !pictograph.blueMotionData) {
                throw new Error('Motion data is missing for red or blue motion');
            }

            const redMotion = new Motion(pictograph, pictograph.redMotionData);
            const blueMotion = new Motion(pictograph, pictograph.blueMotionData);

            // Wait for motion initialization to complete
            await Promise.all([redMotion.ready, blueMotion.ready]);

            // Store the motions
            this.components.motions.red = redMotion;
            this.components.motions.blue = blueMotion;
        } catch (error) {
            throw new Error(`Motion initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Create props and arrows in parallel
     */
    private async createComponentsInParallel(): Promise<void> {
        try {
            await Promise.all([
                this.createAndStoreProps(),
                this.createAndStoreArrows()
            ]);
        } catch (error) {
            throw new Error(`Component creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Create props for both red and blue motions
     */
    private async createAndStoreProps(): Promise<void> {
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
        } catch (error) {
            throw new Error(`Prop creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Create arrows for both red and blue motions
     */
    private async createAndStoreArrows(): Promise<void> {
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
        } catch (error) {
            throw new Error(`Arrow creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update element stores with created component data
     */
    private updateElementsStore(): void {
        this.validateComponents();

        this.elements.update((els) => {
            // Update red prop data
            els.redPropData.set({
                ...this.components.props.red!,
                motionId: this.components.motions.red!.id
            });

            // Update blue prop data
            els.bluePropData.set({
                ...this.components.props.blue!,
                motionId: this.components.motions.blue!.id
            });

            // Update red arrow data
            els.redArrowData.set({
                ...this.components.arrows.red!,
                motionId: this.components.motions.red!.id,
                motionType: this.components.motions.red!.motionType,
                startOri: this.components.motions.red!.startOri,
                turns: this.components.motions.red!.turns,
                propRotDir: this.components.motions.red!.propRotDir
            });

            // Update blue arrow data
            els.blueArrowData.set({
                ...this.components.arrows.blue!,
                motionId: this.components.motions.blue!.id,
                motionType: this.components.motions.blue!.motionType,
                startOri: this.components.motions.blue!.startOri,
                turns: this.components.motions.blue!.turns,
                propRotDir: this.components.motions.blue!.propRotDir
            });

            // Update motion data
            els.redMotion.set(this.components.motions.red!);
            els.blueMotion.set(this.components.motions.blue!);

            return els;
        });
    }

    /**
     * Validate that all required components have been created
     */
    private validateComponents(): void {
        const missingComponents = [];

        if (!this.components.motions.red) missingComponents.push('red motion');
        if (!this.components.motions.blue) missingComponents.push('blue motion');
        if (!this.components.props.red) missingComponents.push('red prop');
        if (!this.components.props.blue) missingComponents.push('blue prop');
        if (!this.components.arrows.red) missingComponents.push('red arrow');
        if (!this.components.arrows.blue) missingComponents.push('blue arrow');

        if (missingComponents.length > 0) {
            throw new Error(`Cannot update elements store: Missing components: ${missingComponents.join(', ')}`);
        }
    }

    /**
     * Handle initialization errors
     */
    private handleInitializationError(error: any): void {
        console.error('❌ Initialization failed:', error);
        this.rejectReady(error);
        throw error;
    }
}