<script lang="ts">
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
	import { optionPickerState } from '../optionPickerState.svelte';
	import { pictographData } from '$lib/state/pictograph/pictographDataState.svelte';
	import { onMount } from 'svelte';

	let testResults = $state<string[]>([]);
	let isTestRunning = $state(false);

	function addTestResult(message: string) {
		testResults = [...testResults, `${new Date().toLocaleTimeString()}: ${message}`];
		console.log('🧪 TEST:', message);
	}

	async function runReactiveFlowTest() {
		if (isTestRunning) return;

		isTestRunning = true;
		testResults = [];

		try {
			addTestResult('Starting reactive flow test...');

			// Wait for pictograph data to be available
			if (!pictographData.isInitialized) {
				addTestResult('Waiting for pictograph data...');
				await pictographData.waitForInitialization(5000);
			}

			if (pictographData.isEmpty) {
				addTestResult('ERROR: No pictograph data available');
				return;
			}

			// Clear any existing sequence
			addTestResult('Clearing existing sequence...');
			await sequenceState.clearSequence();

			// Wait a moment for state to settle
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Check initial state
			addTestResult(
				`Initial state - isEmpty: ${sequenceState.isEmpty}, options: ${optionPickerState.options.length}`
			);

			// Get a test start position
			const allPictographs = pictographData.data;
			const testStartPos = allPictographs.find((p: any) => p.letter === 'A' && p.startPos === 'n');

			if (!testStartPos) {
				addTestResult('ERROR: Could not find test start position (A, n)');
				return;
			}

			addTestResult(`Setting start position: ${testStartPos.letter} ${testStartPos.startPos}`);

			// Set the start position
			await sequenceState.setStartPosition(testStartPos);

			// Wait for reactive effects to process
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Check state after start position set
			addTestResult(
				`After start position - isEmpty: ${sequenceState.isEmpty}, options: ${optionPickerState.options.length}`
			);

			// Check if options were loaded
			if (optionPickerState.options.length > 0) {
				addTestResult(
					`✅ SUCCESS: ${optionPickerState.options.length} options loaded automatically`
				);
			} else {
				addTestResult('❌ FAILURE: No options loaded after start position selection');
			}
		} catch (error) {
			addTestResult(`ERROR: ${error}`);
		} finally {
			isTestRunning = false;
		}
	}

	function clearTest() {
		testResults = [];
	}

	onMount(() => {
		// Auto-run test after a short delay
		setTimeout(() => {
			runReactiveFlowTest();
		}, 1000);
	});
</script>

<div class="test-panel">
	<h3>Reactive Flow Test</h3>

	<div class="test-controls">
		<button onclick={runReactiveFlowTest} disabled={isTestRunning}>
			{isTestRunning ? 'Running Test...' : 'Run Test'}
		</button>
		<button onclick={clearTest}>Clear Results</button>
	</div>

	<div class="test-results">
		<h4>Test Results:</h4>
		<div class="results-list">
			{#each testResults as result}
				<div
					class="result-item"
					class:success={result.includes('SUCCESS')}
					class:error={result.includes('ERROR') || result.includes('FAILURE')}
				>
					{result}
				</div>
			{/each}
		</div>
	</div>

	<div class="current-state">
		<h4>Current State:</h4>
		<p>Sequence isEmpty: {sequenceState.isEmpty}</p>
		<p>Has start position: {!!sequenceState.startPosition}</p>
		<p>Beat count: {sequenceState.beats.length}</p>
		<p>Options count: {optionPickerState.options.length}</p>
		<p>Options loading: {optionPickerState.isLoading}</p>
	</div>
</div>

<style>
	.test-panel {
		position: fixed;
		top: 10px;
		right: 10px;
		width: 400px;
		background: white;
		border: 2px solid #333;
		border-radius: 8px;
		padding: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 9999;
		font-family: monospace;
		font-size: 12px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.test-controls {
		margin-bottom: 16px;
		display: flex;
		gap: 8px;
	}

	.test-controls button {
		padding: 8px 12px;
		border: 1px solid #333;
		background: #f0f0f0;
		cursor: pointer;
		border-radius: 4px;
	}

	.test-controls button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.results-list {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid #ddd;
		padding: 8px;
		background: #f9f9f9;
	}

	.result-item {
		margin-bottom: 4px;
		padding: 2px 4px;
		border-radius: 2px;
	}

	.result-item.success {
		background: #d4edda;
		color: #155724;
	}

	.result-item.error {
		background: #f8d7da;
		color: #721c24;
	}

	.current-state {
		margin-top: 16px;
		padding: 8px;
		background: #e9ecef;
		border-radius: 4px;
	}

	.current-state p {
		margin: 4px 0;
	}
</style>
