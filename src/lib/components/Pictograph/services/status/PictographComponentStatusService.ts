import { get, type Writable } from 'svelte/store';
import {
	DEFAULT_COMPONENT_LOADING,
	DEFAULT_COMPONENT_POSITIONING,
	type RenderStage,
	type ComponentLoadingStatus,
	type ComponentPositioningStatus
} from '../../constants/trackingConstants';
import {
	checkAllComponentsLoaded,
	checkAllComponentsPositioned,
	determineNextStage,
	handleComponentError
} from '../../utils/componentStatusUtils';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { PictographManagers } from '../../core/PictographManagers';
import { PictographPositioningService } from '../positioning/PictographPositioningService';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { PictographValidationService } from '../validation/PictographValidationService';

type StageChangeCallback = (stage: RenderStage) => void;
type ComponentsReadyCallback = () => void;
type PositioningCompleteCallback = () => void;

export class PictographComponentStatusService {
	private componentLoading: ComponentLoadingStatus = {
		...DEFAULT_COMPONENT_LOADING
	};
	private componentPositioning: ComponentPositioningStatus = {
		...DEFAULT_COMPONENT_POSITIONING
	};
	private getCurrentStage: () => RenderStage;
	private positioningService: PictographPositioningService;
	private pictographManagers: PictographManagers | null = null;
	private redPropStore: Writable<PropData | null>;
	private bluePropStore: Writable<PropData | null>;
	private redArrowStore: Writable<ArrowData | null>;
	private blueArrowStore: Writable<ArrowData | null>;
	private validationService: PictographValidationService;
	private onStageChange: StageChangeCallback;
	private onComponentsReady: ComponentsReadyCallback;
	private onPositioningComplete: PositioningCompleteCallback;
	private debug: boolean;

	constructor(
		getCurrentStage: () => RenderStage,
		onStageChange: StageChangeCallback,
		onComponentsReady: ComponentsReadyCallback,
		onPositioningComplete: PositioningCompleteCallback,
		redPropStore: Writable<PropData | null>,
		bluePropStore: Writable<PropData | null>,
		redArrowStore: Writable<ArrowData | null>,
		blueArrowStore: Writable<ArrowData | null>,
		validationService: PictographValidationService,
		debug: boolean = false
	) {
		this.getCurrentStage = getCurrentStage;
		this.onStageChange = onStageChange;
		this.onComponentsReady = onComponentsReady;
		this.onPositioningComplete = onPositioningComplete;
		this.redPropStore = redPropStore;
		this.bluePropStore = bluePropStore;
		this.redArrowStore = redArrowStore;
		this.blueArrowStore = blueArrowStore;
		this.validationService = validationService;
		this.positioningService = new PictographPositioningService(debug);
		this.debug = debug;
		if (this.debug) console.log('🔄 ComponentStatusService: Initialized');
	}

	// Set the managers when they're ready
	public setManagers(managers: PictographManagers | null): void {
		this.pictographManagers = managers;
		if (this.debug) console.log('📊 StatusService: PictographManagers set');
	}

	public updateComponentStatus(
		componentKey: keyof ComponentLoadingStatus | keyof ComponentPositioningStatus,
		type: 'loading' | 'positioning',
		isComplete: boolean = true
	): void {
		if (this.debug)
			console.log(`📊 StatusService: Updating ${componentKey} - ${type}: ${isComplete}`);

		if (type === 'loading') {
			if (componentKey in this.componentLoading) {
				this.componentLoading[componentKey as keyof ComponentLoadingStatus] = isComplete;
			} else {
				console.warn(
					`❓ StatusService: Invalid component key "${componentKey}" for loading status.`
				);
				return;
			}
		} else {
			if (componentKey in this.componentPositioning) {
				this.componentPositioning[componentKey as keyof ComponentPositioningStatus] = isComplete;
			} else {
				console.warn(
					`❓ StatusService: Invalid component key "${componentKey}" for positioning status.`
				);
				return;
			}
		}

		this.checkAndTransitionStage();
	}

	public reportComponentError(componentKey: keyof ComponentLoadingStatus, error?: any): void {
		if (this.debug) {
			console.error(`❌ StatusService: Error reported by ${componentKey}:`, error);
		}

		this.componentLoading = handleComponentError(componentKey, this.componentLoading);

		if (this.debug)
			console.log(`🚦 StatusService: Marked ${componentKey} as loaded after error to proceed.`);

		this.checkAndTransitionStage();
	}

	private checkAndTransitionStage(): void {
		const currentStage = this.getCurrentStage();
		const allLoaded = checkAllComponentsLoaded(this.componentLoading);
		const allPositioned = checkAllComponentsPositioned(this.componentPositioning);
		const nextStage = determineNextStage(currentStage, allLoaded, allPositioned);

		if (nextStage !== currentStage) {
			if (this.debug) {
				console.log(
					`🚀 StatusService: Stage transition triggered: ${currentStage} -> ${nextStage}`
				);
				console.log('   Loading Status: ', this.componentLoading);
				console.log('   Positioning Status: ', this.componentPositioning);
			}

			this.onStageChange(nextStage);

			if (nextStage === 'components_ready') {
				if (this.debug)
					console.log(' MERN StatusService: All components loaded, triggering onComponentsReady.');
				this.onComponentsReady();
			} else if (nextStage === 'positioning') {
				if (this.debug)
					console.log('🚀 StatusService: Starting positioning process.');
				this.triggerPositioning();
			} else if (nextStage === 'complete') {
				if (this.debug)
					console.log('✅ StatusService: Positioning complete, triggering onPositioningComplete.');
				this.onPositioningComplete();
			}
		}
	}

	public resetStatus(): void {
		this.componentLoading = { ...DEFAULT_COMPONENT_LOADING };
		this.componentPositioning = { ...DEFAULT_COMPONENT_POSITIONING };
		if (this.debug) console.log('🔄 StatusService: Status reset.');
	}

	public getComponentLoadingStatus(): Readonly<ComponentLoadingStatus> {
		return { ...this.componentLoading };
	}

	public getComponentPositioningStatus(): Readonly<ComponentPositioningStatus> {
		return { ...this.componentPositioning };
	}

	// Implement the triggerPositioning method
	public triggerPositioning(): void {
		if (this.debug) console.log('🔄 StatusService: Triggering positioning process');
		
		const redProp = get(this.redPropStore);
		const blueProp = get(this.bluePropStore);
		const redArrow = get(this.redArrowStore);
		const blueArrow = get(this.blueArrowStore);
		
		// Update positioning status callback
		const updatePositioningStatus = (component: keyof ComponentPositioningStatus, isComplete: boolean) => {
			this.updateComponentStatus(component, 'positioning', isComplete);
		};
		
		// Arrow validation function
		const validateArrow = (arrow: ArrowData | null): boolean => {
			return this.validationService.validateArrowDataForPositioning(arrow);
		};
		
		// Data completeness check
		const isDataComplete = (): boolean => {
			return this.validationService.isDataCompleteForRendering(
				redProp, blueProp, redArrow, blueArrow, 
				this.getCurrentStage(), true
			);
		};
		
		// Execute the positioning process
		this.positioningService.updatePlacements(
			this.pictographManagers,
			redProp,
			blueProp,
			redArrow,
			blueArrow,
			updatePositioningStatus,
			validateArrow,
			isDataComplete,
			this.onStageChange,
			(data) => {
				// Handle loaded event data
				if (data && data.error) {
					if (this.debug) console.error('❌ StatusService: Positioning reported an error', data);
				}
				// We don't call onPositioningComplete here, as it will be called
				// when all components report as positioned through updateComponentStatus
			}
		).then(({ redProp: newRedProp, blueProp: newBlueProp }) => {
			// Update stores with positioned props if needed
			if (newRedProp && !this.isEqual(newRedProp, redProp)) {
				this.redPropStore.set(newRedProp);
			}
			if (newBlueProp && !this.isEqual(newBlueProp, blueProp)) {
				this.bluePropStore.set(newBlueProp);
			}
			
			if (this.debug) console.log('✅ StatusService: Props positioning applied to stores');
		}).catch(error => {
			console.error('❌ StatusService: Positioning process failed', error);
			// Mark components as positioned anyway to allow progress
			updatePositioningStatus('redProp', true);
			updatePositioningStatus('blueProp', true);
			updatePositioningStatus('redArrow', true);
			updatePositioningStatus('blueArrow', true);
		});
	}
	
	// Utility to compare objects
	private isEqual(obj1: any, obj2: any): boolean {
		return JSON.stringify(obj1) === JSON.stringify(obj2);
	}
}