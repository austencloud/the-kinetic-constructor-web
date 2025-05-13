<!-- src/lib/components/SequenceWorkbench/share/ImageExportTester.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { showError, showSuccess } from '$lib/components/shared/ToastManager.svelte';
  import { logger } from '$lib/core/logging';
  import { testImageExport, testImageDownload, type ImageExportTestResult } from './utils/ImageExportTester';
  
  // State
  let testResult = $state<ImageExportTestResult | null>(null);
  let isRunningTest = $state(false);
  let testLog: string[] = $state([]);
  
  // Run the image export test
  async function runExportTest() {
    if (isRunningTest) return;
    
    isRunningTest = true;
    testLog = ['Starting image export test...'];
    
    try {
      testLog.push('Testing image export pipeline...');
      const result = await testImageExport();
      testResult = result;
      
      if (result.success) {
        testLog.push('✅ Image export test successful!');
        testLog.push(`MIME type: ${result.mimeType}`);
        testLog.push(`Data URL length: ${result.dataUrlLength}`);
        testLog.push(`Image dimensions: ${result.imageWidth}x${result.imageHeight}`);
        testLog.push(`Blob size: ${result.blobSize} bytes`);
        testLog.push(`Blob type: ${result.blobType}`);
        showSuccess('Image export test successful!');
      } else {
        testLog.push(`❌ Image export test failed at stage: ${result.stage}`);
        testLog.push(`Error: ${result.error}`);
        showError(`Image export test failed: ${result.error}`);
      }
    } catch (error) {
      testLog.push(`❌ Exception during test: ${error instanceof Error ? error.message : String(error)}`);
      showError('Test failed with exception');
      logger.error('Image export test exception', {
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      isRunningTest = false;
    }
  }
  
  // Run the image download test
  async function runDownloadTest() {
    if (isRunningTest) return;
    
    isRunningTest = true;
    testLog = ['Starting image download test...'];
    
    try {
      testLog.push('Testing image download pipeline...');
      const result = await testImageDownload();
      testResult = result;
      
      if (result.success) {
        testLog.push('✅ Image download test successful!');
        testLog.push('Download should have started in your browser.');
        showSuccess('Image download test successful!');
      } else {
        testLog.push(`❌ Image download test failed at stage: ${result.stage}`);
        testLog.push(`Error: ${result.error}`);
        showError(`Image download test failed: ${result.error}`);
      }
    } catch (error) {
      testLog.push(`❌ Exception during test: ${error instanceof Error ? error.message : String(error)}`);
      showError('Test failed with exception');
      logger.error('Image download test exception', {
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      isRunningTest = false;
    }
  }
  
  // Run a test on mount
  onMount(() => {
    if (browser) {
      // Add a small delay to ensure the component is fully mounted
      setTimeout(() => {
        runExportTest();
      }, 500);
    }
  });
</script>

<div class="image-export-tester">
  <h2>Image Export Diagnostic Tool</h2>
  
  <div class="test-controls">
    <button 
      onclick={runExportTest} 
      disabled={isRunningTest}
      class="test-button"
    >
      {isRunningTest ? 'Running Test...' : 'Test Image Export'}
    </button>
    
    <button 
      onclick={runDownloadTest} 
      disabled={isRunningTest}
      class="test-button"
    >
      {isRunningTest ? 'Running Test...' : 'Test Image Download'}
    </button>
  </div>
  
  <div class="test-results">
    <h3>Test Log</h3>
    <div class="log-container">
      {#each testLog as logEntry}
        <div class="log-entry">{logEntry}</div>
      {/each}
    </div>
    
    {#if testResult && testResult.success && testResult.dataUrl}
      <div class="image-preview">
        <h3>Image Preview</h3>
        <img src={testResult.dataUrl} alt="Exported test preview" />
      </div>
    {/if}
  </div>
</div>

<style>
  .image-export-tester {
    padding: 20px;
    background-color: #f5f5f5;
    border-radius: 8px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  h2 {
    margin-top: 0;
    color: #333;
  }
  
  .test-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .test-button {
    padding: 10px 15px;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .test-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .test-results {
    background-color: white;
    padding: 15px;
    border-radius: 4px;
    border: 1px solid #ddd;
  }
  
  .log-container {
    max-height: 300px;
    overflow-y: auto;
    background-color: #f0f0f0;
    padding: 10px;
    border-radius: 4px;
    font-family: monospace;
    margin-bottom: 20px;
  }
  
  .log-entry {
    margin-bottom: 5px;
    line-height: 1.4;
  }
  
  .image-preview {
    text-align: center;
  }
  
  .image-preview img {
    max-width: 100%;
    max-height: 300px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
</style>
