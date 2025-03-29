// src/lib/components/Pictograph/context/PictographContext.ts
import { setContext, getContext, hasContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import { PictographInitializer } from '../core/PictographInitializer';
import { PictographManagers } from '../core/PictographManagers';
import { RenderStateMachine, RenderState, RenderEvent } from '../utils/RenderStateMachine';
import { Logger } from '$lib/utils/Logger';

/**
 * Context key used for Svelte's context API
 */
const CONTEXT_KEY = 'pictograph-context';

/**
 * Type definition for the shared Pictograph context
 */
export interface PictographContext {
  // Data stores
  pictographDataStore: Writable<PictographData>;
  redPropStore: Writable<PropData | null>;
  bluePropStore: Writable<PropData | null>;
  redArrowStore: Writable<ArrowData | null>;
  blueArrowStore: Writable<ArrowData | null>;
  gridDataStore: Writable<GridData | null>;
  
  // Core services
  stateMachine: RenderStateMachine;
  initializer: PictographInitializer | null;
  managers: PictographManagers | null;
  logger: Logger;
  
  // Configuration
  debug: boolean;
  
  // Lifecycle helpers
  initialize: () => Promise<void>;
  reset: () => void;
}

/**
 * Creates and sets the PictographContext in the Svelte context.
 * Should be called from the root Pictograph component.
 */
export function createPictographContext(
  pictographDataStore: Writable<PictographData>,
  stateMachine: RenderStateMachine,
  debug: boolean = false
): PictographContext {
  // Initialize core stores
  const redPropStore = writable<PropData | null>(null);
  const bluePropStore = writable<PropData | null>(null);
  const redArrowStore = writable<ArrowData | null>(null);
  const blueArrowStore = writable<ArrowData | null>(null);
  const gridDataStore = writable<GridData | null>(null);
  
  // Create logger instance
  const logger = new Logger('PictographContext');
  
  // Create the context object
  const context: PictographContext = {
    // Data stores
    pictographDataStore,
    redPropStore,
    bluePropStore,
    redArrowStore,
    blueArrowStore,
    gridDataStore,
    
    // Core services
    stateMachine,
    initializer: null,
    managers: null,
    logger,
    
    // Configuration
    debug,
    
    // Lifecycle helpers
    initialize: async () => {
      logger.debug('Initialize called');
      if (!context.initializer) {
        context.initializer = new PictographInitializer(pictographDataStore);
        
        // Subscribe to data stores to update context stores
        context.initializer.elements.subscribe(elementStores => {
          elementStores.redPropData.subscribe(value => redPropStore.set(value));
          elementStores.bluePropData.subscribe(value => bluePropStore.set(value));
          elementStores.redArrowData.subscribe(value => redArrowStore.set(value));
          elementStores.blueArrowData.subscribe(value => blueArrowStore.set(value));
          elementStores.gridData.subscribe(value => gridDataStore.set(value));
        });
        
        try {
          await context.initializer.initialize();
          
          if (context.initializer.hasIncompleteData) {
            stateMachine.transition(RenderEvent.INCOMPLETE_DATA);
          } else {
            stateMachine.transition(RenderEvent.COMPONENTS_LOADED);
            
            // Initialize managers
            context.managers = new PictographManagers(pictographDataStore);
            await context.managers.initializePlacementManagers();
          }
        } catch (error) {
          logger.error('Initialization failed', error);
          stateMachine.transition(RenderEvent.ERROR_OCCURRED, { error });
          throw error;
        }
      }
    },
    
    reset: () => {
      logger.debug('Reset called');
      context.initializer = null;
      context.managers = null;
      redPropStore.set(null);
      bluePropStore.set(null);
      redArrowStore.set(null);
      blueArrowStore.set(null);
      gridDataStore.set(null);
      stateMachine.transition(RenderEvent.RESET);
    }
  };
  
  // Set the context for Svelte components to consume
  setContext(CONTEXT_KEY, context);
  
  return context;
}

/**
 * Gets the PictographContext from the Svelte context.
 * Should be called from child components that need access.
 */
export function getPictographContext(): PictographContext {
  if (!hasContext(CONTEXT_KEY)) {
    throw new Error('PictographContext not found. Make sure to call createPictographContext first.');
  }
  
  return getContext<PictographContext>(CONTEXT_KEY);
}