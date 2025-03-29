<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import type { SvelteComponent } from 'svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Logger } from '$lib/utils/Logger';
    
    const logger = new Logger('ErrorBoundary');
    const dispatch = createEventDispatcher<{
      error: { error: any; info: string; componentStack?: string };
      errorCaptured: { error: any; recovered: boolean };
    }>();
    
    export let fallback: typeof SvelteComponent | null = null;
    export let onError: ((error: any, info: string) => void) | null = null;
    export let resetCondition: any = undefined;
    export let showMessage = true;
    
    let error: Error | null = null;
    let errorInfo = '';
    let previousResetCondition = resetCondition;
    
    // When the reset condition changes, clear the error
    $: if (resetCondition !== previousResetCondition && error) {
      logger.debug('Reset condition changed, clearing error state');
      error = null;
      errorInfo = '';
      previousResetCondition = resetCondition;
    }
    
    /**
     * This function is called when an error occurs in a child component
     */
    function handleCatchError(event: Event): void {
      const { error: caughtError, info } = (event as CustomEvent).detail;
      
      // Only set the error if we don't already have one
      if (!error) {
        error = caughtError;
        errorInfo = info || 'An error occurred in a child component';
        logger.error(`Error caught: ${errorInfo}`, error);
        
        if (onError) {
          try {
            onError(error, errorInfo);
          } catch (callbackError) {
            logger.error('Error in onError callback', callbackError);
          }
        }
        
        dispatch('error', {
          error: caughtError,
          info: errorInfo
        });
      }
      
      // Prevent the error from propagating
      event.stopPropagation();
    }
    
    /**
     * Resets the error state
     */
    function reset() {
      if (!error) return;
      
      const previousError = error;
      error = null;
      errorInfo = '';
      
      dispatch('errorCaptured', {
        error: previousError,
        recovered: true
      });
      
      logger.info('Error boundary reset');
    }
    
    onMount(() => {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    });
    
    /**
     * Handle unhandled promise rejections that occur within our children
     */
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      // Check if this error is from one of our children
      // This is a basic check and might need improvement
      if (!error && event.reason instanceof Error) {
        error = event.reason;
        errorInfo = 'Unhandled promise rejection';
        logger.error(`Unhandled rejection caught: ${error.message}`, error);
        
        if (onError) {
          try {
            onError(error, errorInfo);
          } catch (callbackError) {
            logger.error('Error in onError callback', callbackError);
          }
        }
        
        dispatch('error', {
          error: error,
          info: errorInfo
        });
        
        // Prevent default handling
        event.preventDefault();
      }
    }
  </script>
  
  {#if error}
    {#if fallback}
      <svelte:component this={fallback} {error} {errorInfo} {reset} />
    {:else if showMessage}
      <div class="error-boundary">
        <div class="error-container">
          <h3>Something went wrong</h3>
          <p class="error-message">{error.message || 'An unexpected error occurred'}</p>
          {#if errorInfo}
            <p class="error-info">{errorInfo}</p>
          {/if}
          <button on:click={reset} class="reset-button">
            Try again
          </button>
        </div>
      </div>
    {/if}
  {:else}
    <div on:error={handleCatchError}>
      <slot />
    </div>
  {/if}
  
  <style>
    .error-boundary {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 240, 240, 0.9);
      border-radius: 4px;
      padding: 1rem;
    }
    
    .error-container {
      max-width: 500px;
      text-align: center;
      padding: 2rem;
      background-color: white;
      border: 1px solid #ff6b6b;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
    }
    
    h3 {
      color: #e53e3e;
      margin-top: 0;
    }
    
    .error-message {
      font-weight: bold;
      margin-bottom: 1rem;
    }
    
    .error-info {
      opacity: 0.7;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    
    .reset-button {
      background-color: #4299e1;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.2s;
    }
    
    .reset-button:hover {
      background-color: #3182ce;
    }
  </style>