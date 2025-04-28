<!--
  Logging Tab for Debug Panel
  
  Displays logs and provides filtering and search capabilities.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    logger, 
    LogLevel, 
    LogDomain,
    createDevTransports
  } from '$lib/core/logging';
	import LogViewer from '../logging/LogViewer.svelte';
  
  // Ensure we have a memory transport for the debug panel
  onMount(() => {
    // Add dev transports if not already added
    logger.setConfig({
      transports: createDevTransports()
    });
    
    // Log that the debug panel was opened
    logger.info('Debug panel logging tab opened', {
      domain: LogDomain.SYSTEM
    });
    
    return () => {
      logger.info('Debug panel logging tab closed', {
        domain: LogDomain.SYSTEM
      });
    };
  });
  
  // Test logging function
  function testLogging() {
    logger.trace('This is a trace message', { domain: LogDomain.SYSTEM });
    logger.debug('This is a debug message', { domain: LogDomain.SYSTEM });
    logger.info('This is an info message', { domain: LogDomain.SYSTEM });
    logger.warn('This is a warning message', { domain: LogDomain.SYSTEM });
    logger.error('This is an error message', { domain: LogDomain.SYSTEM });
    logger.fatal('This is a fatal message', { domain: LogDomain.SYSTEM });
    
    // Test performance logging
    const timer = logger.startTimer('Test operation');
    setTimeout(() => {
      timer.checkpoint('Checkpoint 1');
      setTimeout(() => {
        timer.checkpoint('Checkpoint 2');
        setTimeout(() => {
          timer.end({ result: 'success' });
        }, 50);
      }, 30);
    }, 20);
    
    // Test domain-specific logging
    logger.pictograph('Pictograph test', {
      letter: 'A',
      gridMode: 'diamond',
      componentState: 'loaded',
      renderMetrics: {
        renderTime: 42,
        componentsLoaded: 5,
        totalComponents: 5
      }
    });
    
    logger.svgError('SVG loading test', {
      path: '/images/props/ball.svg',
      component: 'Prop',
      fallbackApplied: true
    });
    
    logger.transition({
      machine: 'appMachine',
      from: 'idle',
      to: 'active',
      event: 'ACTIVATE',
      duration: 15
    });
  }
</script>

<div class="logging-tab">
  <div class="header">
    <h2>Application Logs</h2>
    <button on:click={testLogging}>Test Logging</button>
  </div>
  
  <div class="log-viewer-container">
    <LogViewer 
      maxHeight="500px"
      showToolbar={true}
      showTimestamps={true}
      showSource={true}
      showDomain={true}
      autoScroll={true}
      initialLevel={LogLevel.DEBUG}
    />
  </div>
  
  <div class="info-panel">
    <h3>Logging System Info</h3>
    <p>
      The logging system captures application events at various levels of detail.
      Use the filters above to narrow down the logs you want to see.
    </p>
    
    <h4>URL Configuration</h4>
    <p>
      You can configure logging via URL parameters:
    </p>
    <ul>
      <li><code>?log=debug</code> - Set global log level</li>
      <li><code>?log=app=debug,sequence=error</code> - Domain-specific levels</li>
      <li><code>?log=debug:console,memory</code> - Level with transports</li>
    </ul>
    
    <h4>Log Levels</h4>
    <ul>
      <li><strong>TRACE</strong> - Extremely detailed information</li>
      <li><strong>DEBUG</strong> - Detailed information for debugging</li>
      <li><strong>INFO</strong> - General information about application flow</li>
      <li><strong>WARN</strong> - Potential issues that aren't errors</li>
      <li><strong>ERROR</strong> - Error conditions that might allow recovery</li>
      <li><strong>FATAL</strong> - Severe errors that prevent normal operation</li>
    </ul>
  </div>
</div>

<style>
  .logging-tab {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header h2 {
    margin: 0;
    font-size: 18px;
  }
  
  .log-viewer-container {
    flex: 1;
    min-height: 300px;
  }
  
  .info-panel {
    background-color: #f8f9fa;
    padding: 16px;
    border-radius: 4px;
    border: 1px solid #dee2e6;
  }
  
  .info-panel h3 {
    margin-top: 0;
    font-size: 16px;
  }
  
  .info-panel h4 {
    margin-bottom: 8px;
    font-size: 14px;
  }
  
  .info-panel p {
    margin-bottom: 16px;
  }
  
  .info-panel ul {
    margin-bottom: 16px;
  }
  
  .info-panel code {
    background-color: #e9ecef;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
  }
</style>
