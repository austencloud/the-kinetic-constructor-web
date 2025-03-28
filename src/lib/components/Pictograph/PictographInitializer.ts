// src/lib/components/Pictograph/PictographInitializer.ts
import { get, writable, type Writable } from 'svelte/store';
import { createPictographElements, type PictographElementStores } from './PictographElements';
import { Motion } from '../objects/Motion/Motion';
import { createPropData } from '../objects/Prop/PropFactory';
import { createArrowData } from '../objects/Arrow/ArrowFactory';
import type { PictographData } from '$lib/types/PictographData';
import type { ArrowData } from '../objects/Arrow/ArrowData';
import type { PropData } from '../objects/Prop/PropData';

/**
 * Handles the creation and initialization of all core pictograph components
 * (Motions, Props, Arrows) based on the input `PictographData`.
 *
 * It follows a structured sequence:
 * 1. Validate input data completeness.
 * 2. Create Motion instances.
 * 3. Create PropData and ArrowData instances (concurrently).
 * 4. Update the `elements` stores with the created data.
 *
 * It signals readiness via the `ready` promise and indicates if the input
 * data was incomplete via the `hasIncompleteData` flag.
 */
export class PictographInitializer {
	/** Holds the Svelte stores for initialized pictograph elements. */
	elements: Writable<PictographElementStores>;
	/** Reference to the main pictograph data store. */
	pictographDataStore: Writable<PictographData>;
	/** Promise that resolves when initialization is complete or deemed unnecessary. */
	ready: Promise<void>;
	/** Function to resolve the `ready` promise. */
	public resolveReady!: () => void;
	/** Function to reject the `ready` promise. */
	private rejectReady!: (reason?: any) => void;

	/** Internal state holding created components before storing them. */
	private components: {
		motions: { red?: Motion; blue?: Motion };
		props: { red?: PropData; blue?: PropData };
		arrows: { red?: ArrowData; blue?: ArrowData };
	};
	/** Flag indicating if the initialization process has run. */
	private initialized: boolean = false;
	/** Flag indicating if the input pictograph data was found to be incomplete for full rendering. */
	public hasIncompleteData: boolean = false;
	/** Enables detailed console logging for debugging. */
	private debugMode: boolean = true; // Set to false for production builds

	constructor(pictographDataStore: Writable<PictographData>) {
		this.elements = writable(createPictographElements());
		this.pictographDataStore = pictographDataStore;
		this.components = {
			motions: {},
			props: {},
			arrows: {}
		};

		this.ready = new Promise<void>((resolve, reject) => {
			this.resolveReady = resolve;
			this.rejectReady = reject;
		});

		if (this.debugMode) console.log('🔄 PictographInitializer: Created');
	}

	/**
	 * Initializes all pictograph components based on the data in `pictographDataStore`.
	 * Handles incomplete data scenarios by resolving early.
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			if (this.debugMode) console.log('✅ PictographInitializer: Already initialized');
			return this.ready; // Return existing promise if already run
		}

		if (this.debugMode) console.log('🚀 PictographInitializer: Starting initialization...');

		try {
			const pictograph: PictographData = get(this.pictographDataStore);

			// Step 1: Validate input data
			const isDataSufficient = this.validatePictographData(pictograph);

			// Handle incomplete data: Resolve early, set flag, skip component creation.
			if (!isDataSufficient) {
				console.warn('⚠️ PictographInitializer: Incomplete data detected. Only grid will render.');
				this.hasIncompleteData = true; // Signal incomplete data
				this.initialized = true;
				this.resolveReady(); // Mark as "ready" (for grid rendering)
				return; // Stop further initialization
			}

			// Proceed with full initialization for complete data
			if (this.debugMode) console.log('📊 PictographInitializer: Data sufficient, proceeding...');

			// Step 2: Create and initialize motions
			await this.createAndStoreMotions(pictograph);
			if (this.debugMode) console.log('bewegung PictographInitializer: Motions created');

			// Step 3: Create props and arrows in parallel
			await this.createComponentsInParallel();
			if (this.debugMode) console.log('🎨 PictographInitializer: Props and Arrows created');

			// Step 4: Update element stores with created components
			this.updateElementsStore();
			if (this.debugMode) console.log('💾 PictographInitializer: Element stores updated');

			// Mark initialization as complete
			this.initialized = true;
			this.resolveReady(); // Signal successful completion
			if (this.debugMode) console.log('✅ PictographInitializer: Initialization successful');

		} catch (error) {
			this.handleInitializationError(error);
			// Rethrow عشان the caller (Pictograph.svelte) can potentially handle it
			throw error;
		}
	}

	/**
	 * Validates if the pictograph data contains the minimum required information
	 * (currently, red and blue motion data) for a full render.
	 * @param pictograph - The pictograph data to validate.
	 * @returns `true` if data is sufficient, `false` otherwise.
	 */
	private validatePictographData(pictograph: PictographData): boolean {
		if (!pictograph) {
			console.error('❌ PictographInitializer: Pictograph data is null or undefined.');
			return false;
		}
		// Core requirement: Both motion data objects must exist for a full render.
		const hasRedMotion = !!pictograph.redMotionData;
		const hasBlueMotion = !!pictograph.blueMotionData;

		if (!hasRedMotion || !hasBlueMotion) {
			if (this.debugMode) {
				console.warn(`❓ PictographInitializer: Missing motion data (Red: ${hasRedMotion}, Blue: ${hasBlueMotion}).`);
			}
			return false; // Data is insufficient
		}

		// Optional: Add more granular checks here if needed (e.g., check motionType, startOri)
		// const isRedMotionComplete = hasRedMotion && pictograph.redMotionData?.motionType && pictograph.redMotionData?.startOri;
		// const isBlueMotionComplete = hasBlueMotion && pictograph.blueMotionData?.motionType && pictograph.blueMotionData?.startOri;
		// if (!isRedMotionComplete || !isBlueMotionComplete) {
		//     if (this.debugMode) console.warn(`❓ PictographInitializer: Motion data properties missing.`);
		//     return false;
		// }

		return true; // Data is sufficient
	}

	/**
	 * Creates Motion instances for red and blue based on pictograph data.
	 * Ensures motion readiness before proceeding.
	 * @param pictograph - The pictograph data containing motion details.
	 */
	private async createAndStoreMotions(pictograph: PictographData): Promise<void> {
		try {
			// Ensure motionData exists (already validated, but belt-and-suspenders)
			if (!pictograph.redMotionData || !pictograph.blueMotionData) {
				throw new Error('Motion data is unexpectedly missing.');
			}

			// Assign unique IDs if they don't exist (useful for debugging/tracking)
			pictograph.redMotionData.id ??= crypto.randomUUID();
			pictograph.blueMotionData.id ??= crypto.randomUUID();

			const redMotion = new Motion(pictograph, pictograph.redMotionData);
			const blueMotion = new Motion(pictograph, pictograph.blueMotionData);

			// Wait for both motions to fully initialize (they might have async ops)
			await Promise.all([redMotion.ready, blueMotion.ready]);

			this.components.motions.red = redMotion;
			this.components.motions.blue = blueMotion;
		} catch (error) {
			throw new Error(`Motion creation/initialization failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Orchestrates the parallel creation of props and arrows.
	 */
	private async createComponentsInParallel(): Promise<void> {
		try {
			await Promise.all([
				this.createAndStoreProps(),
				this.createAndStoreArrows()
			]);
		} catch (error) {
			// Error is likely already specific from the called functions
			throw error;
		}
	}

	/**
	 * Creates PropData instances for both red and blue motions.
	 * Relies on Motion instances being available.
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
	 * Creates ArrowData instances for both red and blue motions.
	 * Relies on Motion instances being available.
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
	 * Updates the Svelte stores within `this.elements` with the fully created
	 * component data (props, arrows, motions).
	 * Ensures all required components exist before updating.
	 */
	private updateElementsStore(): void {
		this.validateComponentsExist(); // Throw error if any component is missing

		const redMotion = this.components.motions.red!;
		const blueMotion = this.components.motions.blue!;
		const redProp = this.components.props.red!;
		const blueProp = this.components.props.blue!;
		const redArrow = this.components.arrows.red!;
		const blueArrow = this.components.arrows.blue!;

		this.elements.update((els) => {
			// Update stores using .set() for clarity
			els.redPropData.set({ ...redProp, motionId: redMotion.id });
			els.bluePropData.set({ ...blueProp, motionId: blueMotion.id });

			// Include essential motion details directly in ArrowData for convenience
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

			els.redMotion.set(redMotion);
			els.blueMotion.set(blueMotion);

			// Grid data is handled separately via onPointsReady event

			return els; // Return the updated structure
		});
	}

	/**
	 * Internal validation to ensure all expected components were created before
	 * attempting to update the stores.
	 */
	private validateComponentsExist(): void {
		const missing: string[] = [];
		if (!this.components.motions.red) missing.push('red motion');
		if (!this.components.motions.blue) missing.push('blue motion');
		if (!this.components.props.red) missing.push('red prop');
		if (!this.components.props.blue) missing.push('blue prop');
		if (!this.components.arrows.red) missing.push('red arrow');
		if (!this.components.arrows.blue) missing.push('blue arrow');

		if (missing.length > 0) {
			throw new Error(`Cannot update elements store: Missing components: ${missing.join(', ')}`);
		}
	}

	/**
	 * Handles errors during the initialization process, logs them,
	 * and rejects the main `ready` promise.
	 * @param error - The error object caught.
	 */
	private handleInitializationError(error: any): void {
		console.error('❌ PictographInitializer: Initialization failed!', error);
		this.initialized = false; // Mark as not successfully initialized
		this.rejectReady(error); // Reject the promise
		// Do not re-throw here; let the main initialize catch block handle it
	}
}