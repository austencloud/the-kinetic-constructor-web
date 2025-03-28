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
	private onStageChange: StageChangeCallback;
	private onComponentsReady: ComponentsReadyCallback;
	private onPositioningComplete: PositioningCompleteCallback;
	private debug: boolean;

	constructor(
		getCurrentStage: () => RenderStage,
		onStageChange: StageChangeCallback,
		onComponentsReady: ComponentsReadyCallback,
		onPositioningComplete: PositioningCompleteCallback,
		debug: boolean = false
	) {
		this.getCurrentStage = getCurrentStage;
		this.onStageChange = onStageChange;
		this.onComponentsReady = onComponentsReady;
		this.onPositioningComplete = onPositioningComplete;
		this.debug = debug;
		if (this.debug) console.log('🔄 ComponentStatusService: Initialized');
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
}
