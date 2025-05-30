<!--
  Hover Loop Debugging Test Page

  This page provides a controlled environment to test the hover debugging system
  and identify infinite loops in Option components.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import Option from '$lib/components/ConstructTab/OptionPicker/components/Option.svelte';
	import { LayoutProvider } from '$lib/components/ConstructTab/OptionPicker/layout';
	import type { PictographData } from '$lib/types/PictographData';
	import { hoverDebug, hoverTest } from '$lib/components/Pictograph/ReactiveDebugger.svelte';
	import {
		initializeTestDataLoader,
		getTestPictographsByLetters,
		getRandomTestPictographs
	} from '$lib/utils/tests/pictographTestHelpers';
	import { Letter } from '$lib/types/Letter';

	// Test pictograph data loaded from the data frame
	let testOptions: PictographData[] = $state([]);
	let isLoadingOptions = $state(true);
	let loadError = $state<string | null>(null);

	let debuggingActive = $state(false);
	let testResults = $state<string[]>([]);

	function startDebugging() {
		debuggingActive = true;
		testResults = [];
		hoverDebug.start();
		addResult('🎯 Hover debugging started - hover over the options below');
	}

	function stopDebugging() {
		debuggingActive = false;
		hoverDebug.stop();
		addResult('🎯 Hover debugging stopped - check console for detailed report');
	}

	function runRapidTest() {
		addResult('🧪 Running rapid hover test...');
		hoverTest.rapid(5, 100);
		setTimeout(() => {
			addResult('🧪 Rapid test completed - check console for results');
		}, 1000);
	}

	function runSequentialTest() {
		addResult('🧪 Running sequential hover test...');
		hoverTest.sequential(300);
		setTimeout(() => {
			addResult('🧪 Sequential test completed - check console for results');
		}, 2000);
	}

	function runStressTest() {
		addResult('🧪 Running stress test for 3 seconds...');
		hoverTest.stress(3000);
		setTimeout(() => {
			addResult('🧪 Stress test completed - check console for results');
		}, 3500);
	}

	function addResult(message: string) {
		testResults = [...testResults, `${new Date().toLocaleTimeString()}: ${message}`];
	}

	function clearResults() {
		testResults = [];
	}

	// Load test pictographs from the data frame
	async function loadTestPictographs() {
		try {
			isLoadingOptions = true;
			loadError = null;

			// Initialize the test data loader
			await initializeTestDataLoader();

			// Try to get specific letters first (A, B, C, D, E)
			const specificLetters = [Letter.A, Letter.B, Letter.C, Letter.D, Letter.E];
			let options = await getTestPictographsByLetters(specificLetters);

			// If we don't have enough specific letters, get random ones
			if (options.length < 3) {
				const randomOptions = await getRandomTestPictographs(5);
				options = [...options, ...randomOptions].slice(0, 5);
			}

			testOptions = options;
			addResult(`✅ Loaded ${options.length} test pictographs from data frame`);
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load test data';
			addResult(`❌ Error loading test data: ${loadError}`);
			console.error('Failed to load test pictographs:', error);
		} finally {
			isLoadingOptions = false;
		}
	}

	onMount(async () => {
		// Load test pictographs
		await loadTestPictographs();

		// Make debugging functions available in console
		(window as any).startHoverDebug = startDebugging;
		(window as any).stopHoverDebug = stopDebugging;
		console.log('🎯 Hover debugging test page loaded');
		console.log('Available functions: startHoverDebug(), stopHoverDebug()');
		console.log('Or use the buttons below');
	});
</script>

<div class="test-page">
	<h1>Hover Loop Debugging Test</h1>

	<div class="instructions">
		<h2>Quick Start</h2>
		<p>
			<strong>1.</strong> Click "Start Debugging" → <strong>2.</strong> Hover over pictographs below
			→ <strong>3.</strong> Check console for loops
		</p>
	</div>

	<div class="controls">
		<h2>Debug Controls</h2>
		<div class="button-group">
			<button onclick={startDebugging} disabled={debuggingActive} class="debug-button start">
				Start Debugging
			</button>

			<button onclick={stopDebugging} disabled={!debuggingActive} class="debug-button stop">
				Stop Debugging
			</button>
		</div>

		<div class="button-group">
			<button onclick={runRapidTest} class="test-button"> Rapid Test (5 cycles) </button>

			<button onclick={runSequentialTest} class="test-button"> Sequential Test </button>

			<button onclick={runStressTest} class="test-button"> Stress Test (3s) </button>
		</div>

		<button onclick={clearResults} class="clear-button"> Clear Results </button>
	</div>

	<div class="test-options">
		<h2>Test Options</h2>

		{#if isLoadingOptions}
			<div class="loading-state">
				<p>🔄 Loading test pictographs from data frame...</p>
			</div>
		{:else if loadError}
			<div class="error-state">
				<p>❌ Error loading test data: {loadError}</p>
				<button onclick={loadTestPictographs} class="retry-button"> Retry Loading </button>
			</div>
		{:else if testOptions.length === 0}
			<div class="empty-state">
				<p>⚠️ No test pictographs loaded</p>
				<button onclick={loadTestPictographs} class="retry-button"> Load Test Data </button>
			</div>
		{:else}
			<p>Hover over these Option components to trigger reactive effects:</p>
			<p class="data-info">
				📊 Using {testOptions.length} pictographs from the pictograph data frame
			</p>

			<LayoutProvider>
				<div class="options-grid">
					{#each testOptions as option, index}
						<div class="option-container">
							<h3>
								Letter {option.letter}
								<span class="position-info">({option.startPos} → {option.endPos})</span>
							</h3>
							<div class="motion-info">
								{#if option.redMotionData}
									<span class="motion red">Red: {option.redMotionData.motionType}</span>
								{/if}
								{#if option.blueMotionData}
									<span class="motion blue">Blue: {option.blueMotionData.motionType}</span>
								{/if}
							</div>
							<Option
								pictographData={option}
								onoptionselect={(selected) => addResult(`✅ Option ${selected.letter} selected`)}
							/>
						</div>
					{/each}
				</div>
			</LayoutProvider>
		{/if}
	</div>

	<div class="test-results">
		<h2>Test Results</h2>
		<div class="results-container">
			{#each testResults as result}
				<div class="result-line">{result}</div>
			{/each}
			{#if testResults.length === 0}
				<div class="no-results">No results yet - start debugging and interact with the options</div>
			{/if}
		</div>
	</div>

	<div class="console-info">
		<h2>Console Output</h2>
		<p>Open your browser's developer console (F12) to see detailed logging:</p>
		<ul>
			<li><strong>🎯</strong> - Hover events (mouseenter/mouseleave)</li>
			<li><strong>📍</strong> - Reactive effects firing</li>
			<li><strong>🔄</strong> - Potential loops detected (>5 fires)</li>
			<li><strong>🚨</strong> - Infinite loops detected (>10 fires)</li>
			<li><strong>🔬</strong> - Detailed loop analysis</li>
		</ul>
	</div>
</div>

<style>
	.test-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
		font-family: system-ui, sans-serif;
		min-height: 100vh;
		overflow-y: auto;
	}

	h1 {
		color: #2563eb;
		margin-bottom: 2rem;
	}

	h2 {
		color: #374151;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}

	.instructions {
		background: #f3f4f6;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.instructions p {
		margin: 0;
		font-size: 0.95rem;
	}

	.controls {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.debug-button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.debug-button.start {
		background: #10b981;
		color: white;
	}

	.debug-button.start:hover:not(:disabled) {
		background: #059669;
	}

	.debug-button.stop {
		background: #ef4444;
		color: white;
	}

	.debug-button.stop:hover:not(:disabled) {
		background: #dc2626;
	}

	.debug-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.test-button {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.test-button:hover {
		background: #2563eb;
	}

	.clear-button {
		padding: 0.5rem 1rem;
		background: #6b7280;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.clear-button:hover {
		background: #4b5563;
	}

	.test-results {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.results-container {
		max-height: 150px;
		overflow-y: auto;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		padding: 0.75rem;
	}

	.result-line {
		font-family: monospace;
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
		padding: 0.25rem;
		border-radius: 2px;
	}

	.no-results {
		color: #6b7280;
		font-style: italic;
	}

	.test-options {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.options-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.option-container {
		text-align: center;
	}

	.option-container h3 {
		margin-bottom: 0.5rem;
		color: #374151;
		font-size: 1rem;
	}

	.position-info {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: normal;
	}

	.motion-info {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		font-size: 0.75rem;
	}

	.motion {
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-weight: 500;
	}

	.motion.red {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.motion.blue {
		background: #eff6ff;
		color: #2563eb;
		border: 1px solid #bfdbfe;
	}

	.data-info {
		color: #059669;
		font-weight: 500;
		margin-bottom: 1rem;
	}

	.loading-state,
	.error-state,
	.empty-state {
		text-align: center;
		padding: 2rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		margin: 1rem 0;
	}

	.error-state {
		background: #fef2f2;
		border-color: #fecaca;
		color: #dc2626;
	}

	.retry-button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.retry-button:hover {
		background: #2563eb;
	}

	.console-info {
		background: #1f2937;
		color: #f9fafb;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.console-info h2 {
		color: #f9fafb;
		margin-top: 0;
	}

	.console-info ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.console-info li {
		margin-bottom: 0.5rem;
	}
</style>
