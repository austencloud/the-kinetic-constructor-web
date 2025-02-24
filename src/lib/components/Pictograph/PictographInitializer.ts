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

	constructor(pictographDataStore: Writable<PictographData>) {
		this.elements = writable(createPictographElements());
		this.pictographDataStore = pictographDataStore;
	}

	async initialize() {
		try {
			const pictograph: PictographData = get(this.pictographDataStore);
			console.log('🔥 Initializing Pictograph:', pictograph);

			if (!pictograph.letter) {
				console.warn('⚠️ No letter provided in pictograph data. Aborting initialization.');
				return;
			}

			const [redMotion, blueMotion] = await this.createMotions(pictograph);
			const [redProp, blueProp] = await this.createProps(redMotion, blueMotion);
			const [redArrow, blueArrow] = await this.createArrows(redMotion, blueMotion);

			this.updateElementsStore(redProp, blueProp, redArrow, blueArrow, redMotion, blueMotion);
		} catch (error) {
			console.error('❌ Initialization failed:', error);
		}
	}

	private async createMotions(pictograph: PictographData): Promise<[Motion, Motion]> {
		const redMotion = new Motion(pictograph, pictograph.redMotionData!);
		const blueMotion = new Motion(pictograph, pictograph.blueMotionData!);
		await Promise.all([redMotion.ready, blueMotion.ready]);
		return [redMotion, blueMotion];
	}

	private async createProps(redMotion: Motion, blueMotion: Motion): Promise<[any, any]> {
		const [redProp, blueProp] = await Promise.all([
			createPropData(redMotion),
			createPropData(blueMotion)
		]);
		return [redProp, blueProp];
	}

	private async createArrows(redMotion: Motion, blueMotion: Motion): Promise<[any, any]> {
		const [redArrow, blueArrow] = await Promise.all([
			createArrowData(redMotion),
			createArrowData(blueMotion)
		]);
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
