import { get, writable, type Writable } from 'svelte/store';
import { createPictographElements, type PictographElementStores } from './PictographElements';
import type { PictographData } from '$lib/types/PictographData';
import { Motion } from '$lib/components/objects/Motion/Motion';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import { createPropData } from '$lib/components/objects/Prop/PropFactory';
import { createArrowData } from '$lib/components/objects/Arrow/ArrowFactory';

export class PictographInitializer {
	elements: Writable<PictographElementStores>;
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
	public hasIncompleteData: boolean = false;
	private debugMode: boolean = true;

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

	async initialize(): Promise<void> {
		if (this.initialized) {
			if (this.debugMode) console.log('✅ PictographInitializer: Already initialized');
			return this.ready;
		}

		if (this.debugMode) console.log('🚀 PictographInitializer: Starting initialization...');

		try {
			const pictograph: PictographData = get(this.pictographDataStore);
			const isDataSufficient = this.validatePictographData(pictograph);

			if (!isDataSufficient) {
				console.warn('⚠️ PictographInitializer: Incomplete data detected. Only grid will render.');
				this.hasIncompleteData = true;
				this.initialized = true;
				this.resolveReady();
				return;
			}

			if (this.debugMode) console.log('📊 PictographInitializer: Data sufficient, proceeding...');
			await this.createAndStoreMotions(pictograph);
			if (this.debugMode) console.log('bewegung PictographInitializer: Motions created');
			await this.createComponentsInParallel();
			if (this.debugMode) console.log('🎨 PictographInitializer: Props and Arrows created');
			this.updateElementsStore();
			if (this.debugMode) console.log('💾 PictographInitializer: Element stores updated');
			this.initialized = true;
			this.resolveReady();
			if (this.debugMode) console.log('✅ PictographInitializer: Initialization successful');
		} catch (error) {
			this.handleInitializationError(error);
			throw error;
		}
	}

	private validatePictographData(pictograph: PictographData): boolean {
		if (!pictograph) {
			console.error('❌ PictographInitializer: Pictograph data is null or undefined.');
			return false;
		}
		const hasRedMotion = !!pictograph.redMotionData;
		const hasBlueMotion = !!pictograph.blueMotionData;

		if (!hasRedMotion || !hasBlueMotion) {
			if (this.debugMode) {
				console.warn(`❓ PictographInitializer: Missing motion data (Red: ${hasRedMotion}, Blue: ${hasBlueMotion}).`);
			}
			return false;
		}

		return true;
	}

	private async createAndStoreMotions(pictograph: PictographData): Promise<void> {
		try {
			if (!pictograph.redMotionData || !pictograph.blueMotionData) {
				throw new Error('Motion data is unexpectedly missing.');
			}
			pictograph.redMotionData.id ??= crypto.randomUUID();
			pictograph.blueMotionData.id ??= crypto.randomUUID();
			const redMotion = new Motion(pictograph, pictograph.redMotionData);
			const blueMotion = new Motion(pictograph, pictograph.blueMotionData);
			await Promise.all([redMotion.ready, blueMotion.ready]);
			this.components.motions.red = redMotion;
			this.components.motions.blue = blueMotion;
		} catch (error) {
			throw new Error(`Motion creation/initialization failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async createComponentsInParallel(): Promise<void> {
		try {
			await Promise.all([
				this.createAndStoreProps(),
				this.createAndStoreArrows()
			]);
		} catch (error) {
			throw error;
		}
	}

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

	private updateElementsStore(): void {
		this.validateComponentsExist();

		const redMotion = this.components.motions.red!;
		const blueMotion = this.components.motions.blue!;
		const redProp = this.components.props.red!;
		const blueProp = this.components.props.blue!;
		const redArrow = this.components.arrows.red!;
		const blueArrow = this.components.arrows.blue!;

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
			els.redMotion.set(redMotion);
			els.blueMotion.set(blueMotion);
			return els;
		});
	}

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

	private handleInitializationError(error: any): void {
		console.error('❌ PictographInitializer: Initialization failed!', error);
		this.initialized = false;
		this.rejectReady(error);
	}
}
