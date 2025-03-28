import { get, writable, type Writable } from 'svelte/store';
import { createPictographElements, type PictographElementStores } from './PictographElements';
import type { PictographData } from '$lib/types/PictographData';
import { Motion } from '$lib/components/objects/Motion/Motion';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import { createPropData } from '$lib/components/objects/Prop/PropFactory';
import { createArrowData } from '$lib/components/objects/Arrow/ArrowFactory';
import { Logger } from '$lib/utils/Logger';

/**
 * Responsible for initializing the pictograph components and managing their lifecycle.
 * Creates and stores motions, props, and arrows based on pictograph data.
 */
export class PictographInitializer {
  elements: Writable<PictographElementStores>;
  pictographDataStore: Writable<PictographData>;
  ready: Promise<void>;
  
  private resolveReady!: () => void;
  private rejectReady!: (reason?: any) => void;
  private components = {
    motions: {} as { red?: Motion; blue?: Motion },
    props: {} as { red?: PropData; blue?: PropData },
    arrows: {} as { red?: ArrowData; blue?: ArrowData }
  };
  private initialized = false;
  public hasIncompleteData = false;
  private logger = new Logger('PictographInitializer');

  constructor(pictographDataStore: Writable<PictographData>) {
    this.elements = writable(createPictographElements());
    this.pictographDataStore = pictographDataStore;
    this.ready = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    this.logger.debug('Created');
  }

  /**
   * Initializes the pictograph components based on the current data.
   * Creates motions, props, and arrows in sequence.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.debug('Already initialized');
      return this.ready;
    }

    this.logger.debug('Starting initialization...');

    try {
      const pictograph = get(this.pictographDataStore);
      if (!this.validatePictographData(pictograph)) {
        return this.handleIncompleteData();
      }

      this.logger.debug('Data sufficient, proceeding...');
      await this.createAndStoreMotions(pictograph);
      await this.createComponentsInParallel();
      this.updateElementsStore();
      
      this.initialized = true;
      this.resolveReady();
      this.logger.debug('Initialization successful');
    } catch (error) {
      this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * Validates that the pictograph data has the required properties.
   */
  private validatePictographData(pictograph: PictographData): boolean {
    if (!pictograph) {
      this.logger.error('Pictograph data is null or undefined.');
      return false;
    }
    
    const hasRedMotion = !!pictograph.redMotionData;
    const hasBlueMotion = !!pictograph.blueMotionData;

    if (!hasRedMotion || !hasBlueMotion) {
      this.logger.warn(`Missing motion data (Red: ${hasRedMotion}, Blue: ${hasBlueMotion}).`);
      return false;
    }

    return true;
  }

  /**
   * Creates and initializes motion objects for both red and blue components.
   */
  private async createAndStoreMotions(pictograph: PictographData): Promise<void> {
    try {
      if (!pictograph.redMotionData || !pictograph.blueMotionData) {
        throw new Error('Motion data is unexpectedly missing.');
      }
      
      // Ensure IDs exist
      pictograph.redMotionData.id ??= crypto.randomUUID();
      pictograph.blueMotionData.id ??= crypto.randomUUID();
      
      // Create and initialize motions
      const redMotion = new Motion(pictograph, pictograph.redMotionData);
      const blueMotion = new Motion(pictograph, pictograph.blueMotionData);
      
      // Wait for both motions to be ready
      await Promise.all([redMotion.ready, blueMotion.ready]);
      
      this.components.motions.red = redMotion;
      this.components.motions.blue = blueMotion;
    } catch (error) {
      throw new Error(`Motion creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates props and arrows in parallel to improve performance.
   */
  private async createComponentsInParallel(): Promise<void> {
    await Promise.all([
      this.createAndStoreProps(),
      this.createAndStoreArrows()
    ]);
  }

  /**
   * Creates prop data objects for red and blue components.
   */
  private async createAndStoreProps(): Promise<void> {
    if (!this.components.motions.red || !this.components.motions.blue) {
      throw new Error('Cannot create props: Motions not initialized.');
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
   * Creates arrow data objects for red and blue components.
   */
  private async createAndStoreArrows(): Promise<void> {
    if (!this.components.motions.red || !this.components.motions.blue) {
      throw new Error('Cannot create arrows: Motions not initialized.');
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
   * Updates the element stores with the created component data.
   */
  private updateElementsStore(): void {
    this.validateComponentsExist();

    const { red: redMotion, blue: blueMotion } = this.components.motions;
    const { red: redProp, blue: blueProp } = this.components.props;
    const { red: redArrow, blue: blueArrow } = this.components.arrows;

    this.elements.update((els) => {
      els.redPropData.set({ ...redProp!, motionId: redMotion!.id });
      els.bluePropData.set({ ...blueProp!, motionId: blueMotion!.id });
      els.redArrowData.set({
        ...redArrow!,
        motionId: redMotion!.id,
        motionType: redMotion!.motionType,
        startOri: redMotion!.startOri,
        turns: redMotion!.turns,
        propRotDir: redMotion!.propRotDir
      });
      els.blueArrowData.set({
        ...blueArrow!,
        motionId: blueMotion!.id,
        motionType: blueMotion!.motionType,
        startOri: blueMotion!.startOri,
        turns: blueMotion!.turns,
        propRotDir: blueMotion!.propRotDir
      });
      els.redMotion.set(redMotion!);
      els.blueMotion.set(blueMotion!);
      return els;
    });
  }

  /**
   * Validates that all required components exist before updating the store.
   */
  private validateComponentsExist(): void {
    const missingComponents = [
      this.components.motions.red ? null : 'red motion',
      this.components.motions.blue ? null : 'blue motion',
      this.components.props.red ? null : 'red prop',
      this.components.props.blue ? null : 'blue prop',
      this.components.arrows.red ? null : 'red arrow',
      this.components.arrows.blue ? null : 'blue arrow'
    ].filter(Boolean);

    if (missingComponents.length > 0) {
      throw new Error(`Cannot update elements store: Missing components: ${missingComponents.join(', ')}`);
    }
  }

  /**
   * Handles the case where initialization succeeded but the data was incomplete.
   */
  private handleIncompleteData(): Promise<void> {
    this.logger.warn('Incomplete data detected. Only grid will render.');
    this.hasIncompleteData = true;
    this.initialized = true;
    this.resolveReady();
    return this.ready;
  }

  /**
   * Handles initialization errors and rejects the ready promise.
   */
  private handleInitializationError(error: any): void {
    this.logger.error('Initialization failed!', error);
    this.initialized = false;
    this.rejectReady(error);
  }
}