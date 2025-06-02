<!-- Modern OptionPicker Debug Page - Clean Implementation -->
<script lang="ts">
	import { onMount } from 'svelte';
	import ModernServiceProvider from '$lib/providers/ModernServiceProvider.svelte';
	import OptionPicker from '$lib/components/ConstructTab/OptionPicker/OptionPicker.svelte';
	import {
		getRandomPictographData,
		pictographDataLoader
	} from '$lib/utils/testing/PictographDataLoader';

	// Debug state
	let debugLogs = $state<string[]>([]);
	let isDataLoaded = $state(false);
	let serviceProvider: any;

	function addLog(message: string, type: 'info' | 'error' | 'success' = 'info') {
		const timestamp = new Date().toLocaleTimeString();
		const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
		debugLogs = [...debugLogs, `[${timestamp}] ${prefix} ${message}`];
	}

	// Test CSV data loading
	async function testDataLoading() {
		addLog('Testing data loading...');
		try {
			if (!pictographDataLoader.isDataLoaded()) {
				addLog('Loading pictograph data...');
				await pictographDataLoader.getRandomPictographData();
				addLog('Data loaded successfully', 'success');
			} else {
				addLog('Data already loaded', 'success');
			}
			isDataLoaded = true;
		} catch (error) {
			addLog(`Data loading failed: ${error}`, 'error');
		}
	}

	// Test start position selection using modern architecture
	async function testStartPositionSelection() {
		addLog('Testing start position selection...');

		if (!serviceProvider?.sequenceService) {
			addLog('SequenceService not available yet', 'error');
			return;
		}

		if (!isDataLoaded) {
			await testDataLoading();
		}

		try {
			// Get a random start position
			const startPosition = await getRandomPictographData({
				filterByLetter: ['A'],
				includeStaticMotions: true,
				includeDashMotions: true
			});

			if (!startPosition) {
				addLog('Failed to get start position for testing', 'error');
				return;
			}

			addLog(`Got test start position: ${startPosition.letter} (${startPosition.endPos})`);

			// Set start position using modern SequenceService
			await serviceProvider.sequenceService.setStartPosition(startPosition);
			addLog('Set start position in SequenceService');
			addLog('Modern OptionPicker should automatically load options', 'success');
		} catch (error) {
			addLog(`Start position selection test failed: ${error}`, 'error');
		}
	}

	onMount(async () => {
		addLog('Debug page mounted');
		await testDataLoading();
	});
</script>

<div class="debug-page">
	<h1>Modern OptionPicker Debug Page</h1>

	<!-- Controls -->
	<section class="debug-section">
		<h2>Test Controls</h2>
		<div class="button-group">
			<button onclick={testDataLoading}>Test Data Loading</button>
			<button onclick={testStartPositionSelection}>Test Start Position Selection</button>
		</div>
	</section>

	<!-- Service Provider with Modern OptionPicker -->
	<section class="debug-section">
		<h2>Modern OptionPicker Component</h2>
		<div class="component-container">
			<ModernServiceProvider bind:this={serviceProvider}>
				<OptionPicker
					autoLoadPositions={true}
					enableFiltering={true}
					enableSorting={true}
					enableValidation={true}
					showPreview={false}
				/>
			</ModernServiceProvider>
		</div>
	</section>

	<!-- Debug Logs -->
	<section class="debug-section">
		<h2>Debug Logs</h2>
		<div class="logs-container">
			{#each debugLogs as log}
				<div class="log-entry">{log}</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.debug-page {
		padding: 20px;
		max-width: 1200px;
		margin: 0 auto;
		font-family: monospace;
		min-height: 100vh;
	}

	.debug-section {
		margin-bottom: 30px;
		border: 1px solid #ccc;
		padding: 15px;
		border-radius: 5px;
	}

	.debug-section h2 {
		margin-top: 0;
		color: #333;
	}

	.component-container {
		border: 2px solid #007cba;
		padding: 20px;
		border-radius: 5px;
		background: white;
		min-height: 500px;
		height: 600px;
		overflow: auto;
		position: relative;
	}

	.logs-container {
		max-height: 300px;
		overflow-y: auto;
		background: #f8f8f8;
		padding: 10px;
		border-radius: 3px;
	}

	.log-entry {
		font-size: 12px;
		margin-bottom: 2px;
		padding: 2px;
	}

	.log-entry:nth-child(odd) {
		background: rgba(0, 0, 0, 0.05);
	}

	.button-group {
		display: flex;
		gap: 10px;
		margin-top: 10px;
		flex-wrap: wrap;
	}

	.button-group button {
		padding: 8px 16px;
		background: #007cba;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
	}

	.button-group button:hover {
		background: #005a8a;
	}
</style>
