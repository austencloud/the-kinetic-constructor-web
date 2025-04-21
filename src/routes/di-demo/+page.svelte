<script lang="ts">
  import { onMount } from 'svelte';
  import BackgroundController from '$lib/components/Backgrounds/BackgroundController.svelte';
  import BackgroundSettings from '$lib/components/common/BackgroundSettings.svelte';
  import ErrorLogger from '$lib/components/common/ErrorLogger.svelte';
  import ServiceLifetimeDemo from '$lib/components/common/ServiceLifetimeDemo.svelte';
  import ScopeProvider from '$lib/providers/ScopeProvider.svelte';
  import { useService } from '$lib/core/di/useService';
  import { SERVICE_TOKENS } from '$lib/core/di/ServiceTokens';
  import type { ErrorHandler } from '$lib/core/services/ErrorHandling';
  import type { BackgroundType } from '$lib/components/Backgrounds/types/types';
  
  const { service: errorHandler, isReady } = useService<ErrorHandler>(SERVICE_TOKENS.ERROR_HANDLER);
  
  // State
  let dimensions = { width: 0, height: 0 };
  let containerElement: HTMLDivElement;
  let selectedBackground: BackgroundType = 'snowfall';
  let errors: Array<any> = [];
  let fps = 0;
  
  // Update dimensions when component mounts or window resizes
  onMount(() => {
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    
    if (containerElement) {
      resizeObserver.observe(containerElement);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  });
  
  // Watch for errors
  $: if ($isReady) {
    errors = $errorHandler!.getErrors();
  }
  
  function updateDimensions() {
    if (containerElement) {
      dimensions = {
        width: containerElement.clientWidth,
        height: containerElement.clientHeight
      };
    }
  }
  
  function handleBackgroundChange(type: string) {
    selectedBackground = type as BackgroundType;
  }
  
  function handlePerformanceReport(event: CustomEvent<{ fps: number }>) {
    fps = event.detail.fps;
  }
</script>

<div class="demo-layout">
  <h1>Dependency Injection Demo</h1>
  
  <div class="controls-panel">
    <BackgroundSettings onBackgroundChange={handleBackgroundChange} />
    
    <div class="stats">
      <p>FPS: {fps.toFixed(1)}</p>
      <p>Dimensions: {dimensions.width}x{dimensions.height}</p>
    </div>
  </div>
  
  <div class="background-container" bind:this={containerElement}>
    <BackgroundController 
      type={selectedBackground}
      {dimensions}
      on:performanceReport={handlePerformanceReport}
    />
  </div>
  
  <div class="service-demos">
    <div class="demo-section">
      <h2>Service Lifetimes</h2>
      <p>This demonstrates different service lifetimes in the DI system:</p>
      
      <ServiceLifetimeDemo />
      
      <ScopeProvider name="scope-1">
        <div class="scoped-section">
          <h3>Scoped Services (Scope 1)</h3>
          <ServiceLifetimeDemo />
        </div>
      </ScopeProvider>
      
      <ScopeProvider name="scope-2">
        <div class="scoped-section">
          <h3>Scoped Services (Scope 2)</h3>
          <ServiceLifetimeDemo />
        </div>
      </ScopeProvider>
    </div>
  </div>
  
  <div class="error-panel">
    <h3>Error Log ({errors.length})</h3>
    <ErrorLogger componentName="DIDemo">
      {#each errors as error}
        <div class="error-item" class:critical={error.severity === 'critical'}>
          <p class="error-source">{error.source}</p>
          <p class="error-message">{error.message}</p>
          <p class="error-time">{new Date(error.timestamp).toLocaleTimeString()}</p>
        </div>
      {/each}
    </ErrorLogger>
  </div>
</div>

<style>
  .demo-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 1rem;
  }
  
  .controls-panel {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  
  .stats {
    padding: 1rem;
    background-color: #f0f0f0;
    border-radius: 0.5rem;
  }
  
  .stats p {
    margin: 0.25rem 0;
  }
  
  .background-container {
    height: 200px;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    overflow: hidden;
    margin-bottom: 1rem;
  }
  
  .service-demos {
    margin-bottom: 1rem;
  }
  
  .demo-section {
    margin-bottom: 1rem;
  }
  
  .scoped-section {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid #cbd5e0;
    border-radius: 0.5rem;
    background-color: #f7fafc;
  }
  
  .error-panel {
    height: 200px;
    overflow-y: auto;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    padding: 1rem;
  }
  
  .error-panel h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
  
  .error-item {
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    border-left: 3px solid #666;
    background-color: #f9f9f9;
  }
  
  .error-item.critical {
    border-left-color: #e53e3e;
    background-color: #fff5f5;
  }
  
  .error-source {
    font-weight: bold;
    margin: 0;
  }
  
  .error-message {
    margin: 0.25rem 0;
  }
  
  .error-time {
    font-size: 0.8rem;
    color: #666;
    margin: 0;
  }
</style>
