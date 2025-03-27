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

	async initialize() {
		try {
			const pictograph: PictographData = get(this.pictographDataStore);

			if (!pictograph.letter) {
				// Resolve promise even on warning - we can still function with limited data
				this.resolveReady();
				return;
			}



			// Create and wait for motions to be ready
			await this.createAndStoreMotions(pictograph);

			// Create props and arrows in parallel
			await Promise.all([this.createAndStoreProps(), this.createAndStoreArrows()]);

			// Update the elements store with all components
			this.updateElementsStore();

			this.resolveReady(); // Resolve the ready promise
		} catch (error) {
			console.error('❌ Initialization failed:', error);
			this.rejectReady(error); // Reject with error
			throw error;
		}
	}

	private async createAndStoreMotions(pictograph: PictographData): Promise<void> {

		try {
			if (!pictograph.redMotionData || !pictograph.blueMotionData) {
				throw new Error('Missing motion data in pictograph');
			}

			// Generate unique IDs for motions if they don't exist
			if (!pictograph.redMotionData.id) {
				pictograph.redMotionData.id = crypto.randomUUID();
			}
			if (!pictograph.blueMotionData.id) {
				pictograph.blueMotionData.id = crypto.randomUUID();
			}

			const redMotion = new Motion(pictograph, pictograph.redMotionData);
			const blueMotion = new Motion(pictograph, pictograph.blueMotionData);

			// Wait for motion initialization to complete
			await Promise.all([redMotion.ready, blueMotion.ready]);

			// Store the motions
			this.components.motions.red = redMotion;
			this.components.motions.blue = blueMotion;

		} catch (error) {
			throw error;
		}
	}

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
			console.error('❌ Prop creation failed:', error);
			throw error;
		}
	}

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
			throw error;
		}
	}

	private updateElementsStore() {

		if (
			!this.components.props.red ||
			!this.components.props.blue ||
			!this.components.arrows.red ||
			!this.components.arrows.blue ||
			!this.components.motions.red ||
			!this.components.motions.blue
		) {
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

	}
}
