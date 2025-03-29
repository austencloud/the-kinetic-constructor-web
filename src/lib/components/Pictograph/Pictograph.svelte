<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { SvelteComponent } from 'svelte';
	import { get, type Writable } from 'svelte/store';
	
	import type { PictographData } from '$lib/types/PictographData';
	import { createPictographContext } from './context/PictographContext';
	import { RenderState, RenderEvent, getStateMachine } from './utils/RenderStateMachine';
	import { Logger } from '$lib/utils/Logger';
	
	import PictographContent from './components/PictographContent.svelte';
	import ErrorBoundary from './components/ErrorBoundary.svelte';
	import FallbackErrorView from './components/FallbackErrorView.svelte';
	
	// Props
	export let pictographDataStore: Writable<PictographData>;
	export let onClick: (() => void) | undefined = undefined;
	export let debug: boolean = false;
	export let showDebugOverlay: boolean = false;
	
	// Initialize logger
	const logger = new Logger('Pictograph');
	
	// Initialize state machine first - before trying to use it
	const stateMachine = getStateMachine();
	
	// Define state helper functions before passing to context or components
	const isLoading = () => stateMachine.isInState(
	  RenderState.INITIALIZING, 
	  RenderState.LOADING, 
	  RenderState.GRID_READY
	);
	
	const isError = () => stateMachine.isInState(RenderState.ERROR, RenderState.TIMEOUT);
	
	const isComplete = () => stateMachine.isInState(RenderState.COMPLETE);
	
	// Set up event dispatcher for parent components
	const dispatch = createEventDispatcher<{
	  stateChanged: { state: RenderState, prevState: RenderState, event: RenderEvent };
	  loaded: { 
		incompleteData?: boolean; 
		timedOut?: boolean; 
		error?: boolean; 
		message?: string; 
		[key: string]: any 
	  };
	  error: { 
		source: string; 
		error?: any; 
		message?: string 
	  };
	}>();
	
	// Create context for child components AFTER state machine is initialized
	const context = createPictographContext(pictographDataStore, stateMachine, debug);
	
	// Store references
	const { redPropStore, bluePropStore, redArrowStore, blueArrowStore } = context;
	
	// Reactive derived values
	$: letter = get(pictographDataStore)?.letter;
	$: renderState = stateMachine.getState();
	
	// Setup state machine listener
	let unsubscribeFromStateChange: (() => void) | null = null;
	
	function setupStateChangeListener() {
	  if (unsubscribeFromStateChange) {
		unsubscribeFromStateChange();
	  }
	  
	  unsubscribeFromStateChange = stateMachine.onStateChange((newState, prevState, event, payload) => {
		logger.debug(`State changed: ${prevState.toUpperCase()} → ${newState.toUpperCase()} (${event.toUpperCase()})`);
		
		// Dispatch event to parent
		dispatch('stateChanged', { state: newState, prevState, event });
		
		// Handle specific state transitions
		if (newState === RenderState.COMPLETE) {
		  handleComplete(event, payload);
		} else if (newState === RenderState.ERROR) {
		  handleError(event, payload);
		} else if (newState === RenderState.TIMEOUT) {
		  handleTimeout(event, payload);
		}
	  });
	}
	
	/**
	 * Handles completion events
	 */
	function handleComplete(event: RenderEvent, payload?: any) {
	  logger.info('Pictograph rendering complete');
	  
	  const loadedEvent: { [key: string]: any } = { 
		completed: true,
		timeToComplete: stateMachine.getTimeInCurrentState()
	  };
	  
	  if (event === RenderEvent.INCOMPLETE_DATA) {
		loadedEvent.incompleteData = true;
	  }
	  
	  if (payload) {
		Object.assign(loadedEvent, payload);
	  }
	  
	  dispatch('loaded', loadedEvent);
	}
	
	/**
	 * Handles error events
	 */
	function handleError(event: RenderEvent, payload?: any) {
	  const error = payload?.error;
	  const source = payload?.source || 'unknown';
	  const message = error instanceof Error ? error.message : 'An unknown error occurred';
	  
	  logger.error(`Error in ${source}: ${message}`, error);
	  
	  dispatch('error', {
		source,
		error,
		message
	  });
	  
	  dispatch('loaded', { 
		error: true, 
		message,
		source
	  });
	}
	
	/**
	 * Handles timeout events
	 */
	function handleTimeout(event: RenderEvent, payload?: any) {
	  logger.warn('Pictograph rendering timed out');
	  
	  dispatch('error', {
		source: 'timeout',
		message: 'Rendering timed out'
	  });
	  
	  dispatch('loaded', { 
		timedOut: true,
		timeoutAfter: stateMachine.getTimeInCurrentState()
	  });
	}
	
	/**
	 * Handle errors captured by error boundary
	 */
	function handleCapturedError(event: CustomEvent) {
	  const { error, info } = event.detail;
	  stateMachine.transition(RenderEvent.ERROR_OCCURRED, { 
		error, 
		source: 'component_render',
		message: info
	  });
	}
	
	/**
	 * Handle click events on the pictograph wrapper
	 */
	function handleWrapperClick() {
	  if (onClick) {
		onClick();
	  }
	}
	
	/**
	 * Try to recover from errors
	 */
	function recoverFromError() {
	  logger.info('Attempting to recover from error');
	  context.reset();
	  stateMachine.transition(RenderEvent.RETRY);
	}
	
	/**
	 * Initialize the pictograph on mount
	 */
	onMount(() => {
	  // Set up state machine listener first
	  setupStateChangeListener();
	  
	  // Start initialization process
	  (async () => {
		logger.debug(`Pictograph mounted for letter: ${letter || 'N/A'}`);
		
		// Start the initialization process
		stateMachine.transition(RenderEvent.INIT_START);
		
		// Initialize context
		try {
		  await context.initialize();
		} catch (error) {
		  // Error will be handled by the state machine through handleError
		  logger.error('Failed to initialize pictograph', error);
		}
	  })();
	  
	  return () => {
		// Cleanup on component unmount
		logger.debug('Pictograph unmounting, cleaning up');
		if (unsubscribeFromStateChange) {
		  unsubscribeFromStateChange();
		  unsubscribeFromStateChange = null;
		}
	  };
	});
  </script>
  
  <ErrorBoundary 
	on:error={handleCapturedError}
	resetCondition={pictographDataStore}
	fallback={FallbackErrorView as unknown as typeof SvelteComponent}
  >
	<div
	  class="pictograph-wrapper"
	  class:is-loading={isLoading()}
	  class:is-error={isError()}
	  class:is-complete={isComplete()}
	  on:click={handleWrapperClick}
	  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick && onClick()}
	  role={onClick ? 'button' : undefined}
	  tabIndex={onClick ? 0 : undefined}
	  aria-label="Pictograph visualization for {letter || 'unknown'} letter"
	  aria-busy={isLoading()}
	>
	  <svg
		class="pictograph"
		viewBox="0 0 950 950"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
	  >
		<title>Visual representation of letter {letter || 'unknown'}</title>
		<desc>Pictograph visualization showing the motion pattern for the letter {letter || 'unknown'}</desc>
		
		<PictographContent 
		  state={renderState}
		  {showDebugOverlay}
		  {isLoading}
		/>
	  </svg>
	  
	  {#if debug}
		<div class="debug-panel">
		  <p>Letter: {letter || 'N/A'}</p>
		  <p>State: {renderState}</p>
		  <p>Time: {stateMachine.getTimeInCurrentState()}ms</p>
		  {#if isError()}
			<button on:click={recoverFromError}>Retry</button>
		  {/if}
		</div>
	  {/if}
	</div>
  </ErrorBoundary>
  
  <style>
	.pictograph-wrapper {
	  width: 100%;
	  height: 100%;
	  position: relative;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  transition: all 0.3s ease;
	}
  
	.pictograph-wrapper:hover {
	  cursor: pointer;
	}
	
	.pictograph-wrapper.is-loading {
	  background-color: rgba(245, 245, 245, 0.5);
	}
	
	.pictograph-wrapper.is-error {
	  background-color: rgba(254, 215, 215, 0.5);
	}
  
	.pictograph {
	  width: 100%;
	  height: 100%;
	  max-width: 100%;
	  max-height: 100%;
	  display: block;
	  background-color: white;
	  transition: transform 0.1s ease-in-out;
	  transform: scale(1);
	  z-index: 1;
	  position: relative;
	  border: 1px solid #ccc;
	  aspect-ratio: 1 / 1;
	  margin: auto;
	  overflow: visible;
	  transform-origin: center center;
	}
  
	.pictograph-wrapper:hover .pictograph {
	  transform: scale(1.05);
	  z-index: 4;
	  border: 4px solid gold;
	  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
  
	.pictograph-wrapper:active .pictograph {
	  transform: scale(1);
	  transition-duration: 0.05s;
	}
  
	.pictograph-wrapper:focus-visible {
	  outline: none;
	}
  
	.pictograph-wrapper:focus-visible .pictograph {
	  outline: 3px solid #4299e1;
	  outline-offset: 2px;
	}
	
	.debug-panel {
	  position: absolute;
	  top: 10px;
	  right: 10px;
	  background-color: rgba(0, 0, 0, 0.7);
	  color: white;
	  padding: 10px;
	  border-radius: 4px;
	  font-family: monospace;
	  font-size: 12px;
	  z-index: 100;
	  pointer-events: none;
	  max-width: 300px;
	}
	
	.debug-panel p {
	  margin: 5px 0;
	}
	
	.debug-panel button {
	  pointer-events: auto;
	  background-color: #4299e1;
	  color: white;
	  border: none;
	  padding: 4px 8px;
	  border-radius: 4px;
	  cursor: pointer;
	}
  </style>