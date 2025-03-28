// src/lib/components/Pictograph/services/PictographComponentStatusService.ts
import {
	DEFAULT_COMPONENT_LOADING,
	DEFAULT_COMPONENT_POSITIONING,
	type RenderStage,
    type ComponentLoadingStatus,
    type ComponentPositioningStatus
} from '../constants/trackingConstants';
import {
	checkAllComponentsLoaded,
	checkAllComponentsPositioned,
	determineNextStage,
	handleComponentError // Assuming this util exists and is correct
} from '../utils/componentStatusUtils'; // Ensure path is correct


type StageChangeCallback = (stage: RenderStage) => void;
/** Callback triggered when all components are loaded but before positioning. */
type ComponentsReadyCallback = () => void;
/** Callback triggered when positioning is complete (stage becomes 'complete'). */
type PositioningCompleteCallback = () => void;

/**
 * Service responsible for tracking the loading and positioning status
 * of individual visual components within the Pictograph (Grid, Props, Arrows).
 *
 * It determines when to transition between rendering stages based on whether
 * components have loaded and subsequently been positioned.
 */
export class PictographComponentStatusService {
	/** Tracks loading status (e.g., component has rendered initially). */
	private componentLoading: ComponentLoadingStatus = { ...DEFAULT_COMPONENT_LOADING };
	/** Tracks positioning status (e.g., component has received coordinates). */
	private componentPositioning: ComponentPositioningStatus = { ...DEFAULT_COMPONENT_POSITIONING };
	/** The current rendering stage, managed externally but read here. */
	private getCurrentStage: () => RenderStage;
	/** Callback to inform the parent component of a stage change. */
	private onStageChange: StageChangeCallback;
	/** Callback triggered when all components are loaded ('components_ready' stage). */
	private onComponentsReady: ComponentsReadyCallback;
	/** Callback triggered when positioning is complete ('complete' stage). */
	private onPositioningComplete: PositioningCompleteCallback;
	/** Enables detailed console logging. */
	private debug: boolean;

	constructor(
		getCurrentStage: () => RenderStage, // Pass a function to get current stage
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

	/**
	 * Updates the status of a specific component for either 'loading' or 'positioning'.
	 * Triggers a check to see if a stage transition is warranted.
	 *
	 * @param componentKey - The key matching ComponentLoadingStatus or ComponentPositioningStatus.
	 * @param type - Whether this update relates to 'loading' or 'positioning'.
	 * @param isComplete - `true` if the status is complete, `false` otherwise (default: true).
	 */
	public updateComponentStatus(
		componentKey: keyof ComponentLoadingStatus | keyof ComponentPositioningStatus,
		type: 'loading' | 'positioning',
		isComplete: boolean = true
	): void {
		if (this.debug) console.log(`📊 StatusService: Updating ${componentKey} - ${type}: ${isComplete}`);

		if (type === 'loading') {
            // Ensure the key is valid for loading status
            if (componentKey in this.componentLoading) {
			    this.componentLoading[componentKey as keyof ComponentLoadingStatus] = isComplete;
            } else {
                console.warn(`❓ StatusService: Invalid component key "${componentKey}" for loading status.`);
                return;
            }
		} else { // type === 'positioning'
            // Ensure the key is valid for positioning status
             if (componentKey in this.componentPositioning) {
			    this.componentPositioning[componentKey as keyof ComponentPositioningStatus] = isComplete;
             } else {
                 console.warn(`❓ StatusService: Invalid component key "${componentKey}" for positioning status.`);
                 return;
             }
		}

		this.checkAndTransitionStage(); // Check if stage should change
	}

	/**
	 * Handles an error reported by a component during its loading phase.
	 * Marks the component as 'loaded' to allow the process to continue,
	 * potentially rendering a fallback or incomplete view.
	 *
	 * @param componentKey - The key of the component that reported an error.
	 * @param error - Optional error details.
	 */
	public reportComponentError(componentKey: keyof ComponentLoadingStatus, error?: any): void {
		if (this.debug) {
			console.error(`❌ StatusService: Error reported by ${componentKey}:`, error);
		}

        // Use the utility function to mark the component as loaded despite error
		this.componentLoading = handleComponentError(componentKey, this.componentLoading);

		if (this.debug) console.log(`🚦 StatusService: Marked ${componentKey} as loaded after error to proceed.`);

		this.checkAndTransitionStage(); // Check for stage transition
	}

	/**
	 * Checks if all components have reached the required loaded/positioned state
	 * for the current stage and triggers a transition if necessary.
	 */
	private checkAndTransitionStage(): void {
		const currentStage = this.getCurrentStage();
        const allLoaded = checkAllComponentsLoaded(this.componentLoading);
        const allPositioned = checkAllComponentsPositioned(this.componentPositioning);

        const nextStage = determineNextStage(currentStage, allLoaded, allPositioned);

		if (nextStage !== currentStage) {
			if (this.debug) {
				console.log(`🚀 StatusService: Stage transition triggered: ${currentStage} -> ${nextStage}`);
                console.log(`   Loading Status: `, this.componentLoading);
                console.log(`   Positioning Status: `, this.componentPositioning);
			}

			// Inform the parent component to update its stage state
			this.onStageChange(nextStage);

			// Trigger specific callbacks based on the new stage
			if (nextStage === 'components_ready') {
				if (this.debug) console.log(' MERN StatusService: All components loaded, triggering onComponentsReady.');
				this.onComponentsReady(); // Call the positioning trigger
			} else if (nextStage === 'complete') {
                 if (this.debug) console.log('✅ StatusService: Positioning complete, triggering onPositioningComplete.');
				this.onPositioningComplete(); // Call the final loaded event trigger
			}
		}
         // else {
         //     if (this.debug) console.log(`🔄 StatusService: No stage change needed from ${currentStage}. Loaded: ${allLoaded}, Positioned: ${allPositioned}`);
         // }
	}

    /** Resets all tracking status to default. */
    public resetStatus(): void {
        this.componentLoading = { ...DEFAULT_COMPONENT_LOADING };
	    this.componentPositioning = { ...DEFAULT_COMPONENT_POSITIONING };
        if (this.debug) console.log('🔄 StatusService: Status reset.');
    }

	/** Getter for current loading status (returns a copy). */
	public getComponentLoadingStatus(): Readonly<ComponentLoadingStatus> {
		return { ...this.componentLoading };
	}

	/** Getter for current positioning status (returns a copy). */
	public getComponentPositioningStatus(): Readonly<ComponentPositioningStatus> {
		return { ...this.componentPositioning };
	}
}