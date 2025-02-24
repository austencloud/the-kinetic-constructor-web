import { get, writable, type Writable } from 'svelte/store';
import { tick } from 'svelte';
import { createPictographElements } from './PictographElements';
import { Motion } from '../objects/Motion/Motion';
import { createPropData } from '../objects/Prop/PropFactory';
import { createArrowData } from '../objects/Arrow/ArrowFactory';
import ArrowLocationManager from '../objects/Arrow/ArrowLocationManager/ArrowLocationManager';
import ArrowRotAngleManager from '../objects/Arrow/ArrowRotAngleManager/ArrowRotAngleManager';
import type { PictographData } from '$lib/types/PictographData';
import { PropPlacementManager } from '../PlacementManagers/PropPlacementManager/PropPlacementManager';
import { ArrowPlacementManager } from '../PlacementManagers/ArrowPlacementManager/ArrowPlacementManager';
import { PictographManagers } from './PictographManagers';
import type { ArrowData } from '../objects/Arrow/ArrowData';

export class PictographInitializer {
	elements: Writable<ReturnType<typeof createPictographElements>>;
	managers: PictographManagers;
	pictographDataStore: Writable<PictographData>;

	constructor(pictographDataStore: Writable<PictographData>) {
		this.elements = writable(createPictographElements());
		this.managers = new PictographManagers(get(pictographDataStore));
		this.pictographDataStore = pictographDataStore;
	}

	getArrowForMotion(motionId: string): ArrowData | null {
		const redArrow = get(get(this.elements).redArrowData);
		const blueArrow = get(get(this.elements).blueArrowData);
		return redArrow?.motionId === motionId
			? redArrow
			: blueArrow?.motionId === motionId
				? blueArrow
				: null;
	}

	async initialize() {
		try {
			const pictograph: PictographData = get(this.pictographDataStore);
			console.log('🔥 Initializing Pictograph:', pictograph);

			if (!pictograph.letter) {
				console.warn('⚠️ No letter provided in pictograph data. Aborting initialization.');
				return;
			}

			console.log('✅ Grid data is ready, proceeding to create props and arrows...');

			const [redMotion, blueMotion] = await this.createMotions(pictograph);
			console.log('✅ Created motions:', { redMotion, blueMotion });
			const [redProp, blueProp] = await this.createProps(redMotion, blueMotion);
			console.log('✅ Created props:', { redProp, blueProp });
			const [redArrow, blueArrow] = await this.createArrows(redMotion, blueMotion);
			console.log('✅ Created arrows:', { redArrow, blueArrow });
			this.updateElementsStore(redProp, blueProp, redArrow, blueArrow, redMotion, blueMotion);
			console.log('✅ Updated elements store');
			this.setArrowAttributes(redMotion, blueMotion, redArrow, blueArrow);
			console.log('✅ Set arrow attributes');
			this.initializePlacementManagers(pictograph);
			console.log('✅ Initialized placement managers');
			this.updatePlacements(redArrow, blueArrow, redProp, blueProp);
			console.log('✅ Updated placements');

			console.log('✅ Finalized placements:', { redArrow, blueArrow, redProp, blueProp });
		} catch (error) {
			console.error('❌ Initialization failed:', error);
		}
	}

	private async createMotions(pictograph: PictographData): Promise<[Motion, Motion]> {
		const redMotion = new Motion(pictograph, pictograph.redMotionData!);
		const blueMotion = new Motion(pictograph, pictograph.blueMotionData!);
		await Promise.all([redMotion.ready, blueMotion.ready]);
		console.log('✅ Created motions:', { redMotion, blueMotion });
		return [redMotion, blueMotion];
	}

	private async createProps(redMotion: Motion, blueMotion: Motion): Promise<[any, any]> {
		const [redProp, blueProp] = await Promise.all([
			createPropData(redMotion),
			createPropData(blueMotion)
		]);
		console.log('✅ Created props:', { redProp, blueProp });
		return [redProp, blueProp];
	}

	private async createArrows(redMotion: Motion, blueMotion: Motion): Promise<[any, any]> {
		const [redArrow, blueArrow] = await Promise.all([
			createArrowData(redMotion),
			createArrowData(blueMotion)
		]);
		console.log('✅ Created arrows:', { redArrow, blueArrow });
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
		console.log('🔄 Before Store Update:', {
			redPropData: get(get(this.elements).redPropData),
			bluePropData: get(get(this.elements).bluePropData),
			redArrowData: get(get(this.elements).redArrowData),
			blueArrowData: get(get(this.elements).blueArrowData)
		});
	
		this.elements.update((els) => {
			els.redPropData.set({
				...redProp,
				motionId: redMotion.id,
				endLoc: redMotion.endLoc, // ✅ Store motion end location
				endOri: redMotion.endOri  // ✅ Store motion end orientation
			});
	
			els.bluePropData.set({
				...blueProp,
				motionId: blueMotion.id,
				endLoc: blueMotion.endLoc,
				endOri: blueMotion.endOri
			});
	
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
	
		console.log('✅ After Store Update:', {
			redPropData: get(get(this.elements).redPropData),
			bluePropData: get(get(this.elements).bluePropData),
			redArrowData: get(get(this.elements).redArrowData),
			blueArrowData: get(get(this.elements).blueArrowData)
		});
	}
	
	private setArrowAttributes(redMotion: Motion, blueMotion: Motion, redArrow: any, blueArrow: any) {
		redMotion.arrowId = redArrow.id;
		blueMotion.arrowId = blueArrow.id;

		const locationManager = new ArrowLocationManager(this.managers.getter);
		redArrow.loc = locationManager.getArrowLocation(redMotion);
		blueArrow.loc = locationManager.getArrowLocation(blueMotion);

		const rotAngleManager = new ArrowRotAngleManager();
		redArrow.rotAngle = rotAngleManager.updateRotation(redMotion, redArrow.loc);
		blueArrow.rotAngle = rotAngleManager.updateRotation(blueMotion, blueArrow.loc);
	}

	private async initializePlacementManagers(pictograph: PictographData) {
		const gridData = get(get(this.elements).gridData); // ✅ Correct - get the store, then get the value
		if (!gridData) {
			console.error('❌ Grid data is null. Placement managers cannot be initialized.');
			return;
		}

		this.managers.propPlacementManager = new PropPlacementManager(
			pictograph,
			gridData,
			this.managers.checker
		);
		this.managers.arrowPlacementManager = new ArrowPlacementManager(
			pictograph,
			gridData,
			this.managers.checker
		);
	}

	private updatePlacements(redArrow: any, blueArrow: any, redProp: any, blueProp: any) {
		console.log('🟠 Calling updatePropPlacement with:', { redProp, blueProp });
		
		this.managers.arrowPlacementManager?.updateArrowPlacements([redArrow, blueArrow]);
		this.managers.propPlacementManager?.updatePropPlacement([redProp, blueProp]);
	
		console.log('✅ Finished calling updatePropPlacement');
	}
	
}
