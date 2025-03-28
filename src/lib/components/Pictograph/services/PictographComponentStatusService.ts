import { 
    DEFAULT_COMPONENT_LOADING, 
    DEFAULT_COMPONENT_POSITIONING,
    type RenderStage
  } from '../constants/trackingConstants';
  import {
    checkAllComponentsLoaded,
    checkAllComponentsPositioned,
    determineNextStage,
    handleComponentError,
    type ComponentLoadingStatus,
    type ComponentPositioningStatus
  } from '../utils/componentStatusUtils';
  
  type StageChangeCallback = (stage: RenderStage) => void;
  type ActionCallback = () => void;
  
  /**
   * Service to manage component loading and positioning status
   */
  export class PictographComponentStatusService {
    private componentLoading: ComponentLoadingStatus = { ...DEFAULT_COMPONENT_LOADING };
    private componentPositioning: ComponentPositioningStatus = { ...DEFAULT_COMPONENT_POSITIONING };
    private currentStage: RenderStage;
    private onStageChange: StageChangeCallback;
    private onComponentsReady: ActionCallback;
    private onComplete: ActionCallback;
    private debug: boolean;
  
    constructor(
      initialStage: RenderStage,
      onStageChange: StageChangeCallback,
      onComponentsReady: ActionCallback,
      onComplete: ActionCallback,
      debug: boolean = false
    ) {
      this.currentStage = initialStage;
      this.onStageChange = onStageChange;
      this.onComponentsReady = onComponentsReady;
      this.onComplete = onComplete;
      this.debug = debug;
    }
  
    /**
     * Update the status of a component
     */
    public updateComponentStatus(
      component: string, 
      type: 'loading' | 'positioning', 
      isComplete: boolean = true
    ): void {
      if (type === 'loading') {
        this.componentLoading[component as keyof ComponentLoadingStatus] = isComplete;
      } else {
        this.componentPositioning[component as keyof ComponentPositioningStatus] = isComplete;
      }
      
      this.checkComponentStatus();
    }
  
    /**
     * Handle component errors
     */
    public handleComponentError(component: string, error?: any): void {
      if (this.debug) {
        console.error(`Error in ${component}:`, error);
      }
  
      this.componentLoading = handleComponentError(component, this.componentLoading);
      this.checkComponentStatus();
    }
  
    /**
     * Check if all components are loaded/positioned and transition stage if needed
     */
    private checkComponentStatus(): void {
      const allLoaded = checkAllComponentsLoaded(this.componentLoading);
      const allPositioned = checkAllComponentsPositioned(this.componentPositioning);
      const nextStage = determineNextStage(this.currentStage, allLoaded, allPositioned);
  
      if (nextStage !== this.currentStage) {
        if (this.debug) {
          console.log(`Pictograph stage transition: ${this.currentStage} -> ${nextStage}`);
        }
  
        this.currentStage = nextStage;
        this.onStageChange(nextStage);
  
        if (nextStage === 'components_ready') {
          this.onComponentsReady();
        } else if (nextStage === 'complete') {
          this.onComplete();
        }
      }
    }
  
    /**
     * Get the current component loading status
     */
    public getComponentLoading(): ComponentLoadingStatus {
      return { ...this.componentLoading };
    }
  
    /**
     * Get the current component positioning status
     */
    public getComponentPositioning(): ComponentPositioningStatus {
      return { ...this.componentPositioning };
    }
  }