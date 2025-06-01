<!--
  Debug UI Transition Test Page
  Tests the complete UI transition flow from StartPositionPicker to ModernOptionPicker
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { getContext } from 'svelte';
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import type { PictographData } from '$lib/types/PictographData';
	import { Letter } from '$lib/types/Letter';
	import {
		initializeTestDataLoader,
		getTestPictographsByLetters,
		resetTestData
	} from '$lib/utils/tests/pictographTestHelpers';
	import RightPanel from '$lib/components/SequenceWorkbench/RightPanel/RightPanel.svelte';

	// Get SequenceService from context - make it reactive
	const sequenceServiceGetter = getContext<() => ISequenceService | null>('sequenceService');

	// Make sequenceService reactive so it updates when the service becomes available
	let sequenceService = $derived(sequenceServiceGetter?.() || null);

	// Reactive values that depend on the service
	let isEmpty = $derived(sequenceService?.isEmpty ?? true);
	let startPosition = $derived(sequenceService?.state?.startPosition ?? null);
	let beatCount = $derived(sequenceService?.state?.beats?.length ?? 0);

	// Test data from validated pictograph data
	let testStartPositions: PictographData[] = $state([]);
	let dataLoaded = $state(false);

	// Load real pictograph data for testing
	async function loadTestData() {
		try {
			await initializeTestDataLoader();
			const pictographs = await getTestPictographsByLetters([Letter.A, Letter.B, Letter.C]);
			testStartPositions = pictographs;
			dataLoaded = true;
			console.log('✅ Loaded validated test pictographs:', pictographs.length);
		} catch (error) {
			console.error('❌ Failed to load test pictographs:', error);
			dataLoaded = false;
		}
	}

	// Debug logging
	$effect(() => {
		console.log('🔍 Debug UI Transition Page State:', {
			isEmpty,
			startPosition: startPosition?.letter || 'null',
			beatCount,
			hasSequenceService: !!sequenceService,
			testDataLoaded: dataLoaded,
			testDataCount: testStartPositions.length
		});
	});

	// Test functions
	function setTestStartPosition(position: PictographData) {
		if (!sequenceService) {
			console.error('❌ SequenceService not available');
			return;
		}

		console.log(`🎯 Setting start position: ${position.letter}`);
		sequenceService.setStartPosition(position);
	}

	function clearStartPosition() {
		if (!sequenceService) {
			console.error('❌ SequenceService not available');
			return;
		}

		console.log('🧹 Clearing start position');
		sequenceService.setStartPosition(null);
	}

	function clearSequence() {
		if (!sequenceService) {
			console.error('❌ SequenceService not available');
			return;
		}

		console.log('🗑️ Clearing entire sequence');
		sequenceService.clearSequence();
	}

	onMount(() => {
		console.log('🚀 Debug UI Transition Page mounted');

		// Set workbench to construct tab (required for TransitionWrapper to show)
		workbenchStore.update((state) => ({
			...state,
			activeTab: 'construct'
		}));

		// Load test data
		loadTestData();

		console.log('📊 Initial state:', {
			hasSequenceService: !!sequenceService,
			isEmpty: sequenceService?.isEmpty,
			startPosition: sequenceService?.state?.startPosition?.letter || 'null'
		});

		// Cleanup on unmount
		return () => {
			resetTestData();
			// Reset workbench store to default
			workbenchStore.update((state) => ({
				...state,
				activeTab: 'generate'
			}));
		};
	});
</script>

<svelte:head>
	<title>Debug UI Transition</title>
</svelte:head>

<div class="debug-page">
	<header class="debug-header">
		<h1>🔍 UI Transition Debug Page</h1>
		<p>Test the UI transition flow from StartPositionPicker to ModernOptionPicker</p>
	</header>

	<div class="debug-controls">
		<div class="control-section">
			<h2>📊 Current State</h2>
			<div class="state-display">
				<div class="state-item">
					<strong>Service Available:</strong>
					<span class="status" class:success={!!sequenceService} class:error={!sequenceService}>
						{sequenceService ? '✅ Yes' : '❌ No'}
					</span>
				</div>
				<div class="state-item">
					<strong>Test Data Loaded:</strong>
					<span class="status" class:success={dataLoaded} class:error={!dataLoaded}>
						{dataLoaded ? '✅ Yes' : '❌ No'}
					</span>
				</div>
				<div class="state-item">
					<strong>Sequence Empty:</strong>
					<span class="status" class:success={isEmpty} class:warning={!isEmpty}>
						{isEmpty ? '✅ Yes' : '⚠️ No'}
					</span>
				</div>
				<div class="state-item">
					<strong>Start Position:</strong>
					<span class="value">{startPosition?.letter || 'None'}</span>
				</div>
				<div class="state-item">
					<strong>Beat Count:</strong>
					<span class="value">{beatCount}</span>
				</div>
			</div>
		</div>

		<div class="control-section">
			<h2>🎮 Test Controls</h2>
			<div class="button-grid">
				{#if dataLoaded && testStartPositions.length > 0}
					{#each testStartPositions as position}
						<button
							class="test-button"
							onclick={() => setTestStartPosition(position)}
							disabled={!sequenceService}
						>
							Set Start Position {position.letter}
							<small>({position.startPos} → {position.endPos})</small>
						</button>
					{/each}
				{:else}
					<div class="loading-state">
						{#if !dataLoaded}
							<p>Loading validated test data...</p>
						{:else}
							<p>No test data available</p>
						{/if}
					</div>
				{/if}
				<button
					class="test-button clear"
					onclick={clearStartPosition}
					disabled={!sequenceService || isEmpty}
				>
					Clear Start Position
				</button>
				<button
					class="test-button clear"
					onclick={clearSequence}
					disabled={!sequenceService || isEmpty}
				>
					Clear Sequence
				</button>
			</div>
		</div>

		<div class="control-section">
			<h2>📝 Expected Behavior</h2>
			<ul class="behavior-list">
				<li>
					<strong>When sequence is empty:</strong> Should show StartPositionPicker
				</li>
				<li>
					<strong>When start position is set:</strong> Should transition to ModernOptionPicker
				</li>
				<li>
					<strong>When start position is cleared:</strong> Should transition back to StartPositionPicker
				</li>
				<li>
					<strong>Test data:</strong> Uses real, validated pictograph data from CSV files
				</li>
				<li>
					<strong>Console logs:</strong> Should show debug output for state changes
				</li>
			</ul>
		</div>
	</div>

	<div class="ui-container">
		<h2>🖼️ UI Component</h2>
		<div class="right-panel-wrapper">
			{#if sequenceService}
				<RightPanel />
			{:else}
				<div class="error-state">
					<h3>❌ SequenceService Not Available</h3>
					<p>The SequenceService is not properly injected via context.</p>
					<p>Check that ModernServiceProvider is wrapping this page.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.debug-page {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		font-family: system-ui, sans-serif;
	}

	.debug-header {
		text-align: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.debug-header h1 {
		margin: 0 0 0.5rem 0;
		color: #1f2937;
	}

	.debug-header p {
		margin: 0;
		color: #6b7280;
	}

	.debug-controls {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.control-section {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.control-section h2 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		color: #374151;
	}

	.state-display {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.state-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: white;
		border-radius: 4px;
		border: 1px solid #e5e7eb;
	}

	.status.success {
		color: #059669;
		font-weight: 600;
	}

	.status.warning {
		color: #d97706;
		font-weight: 600;
	}

	.status.error {
		color: #dc2626;
		font-weight: 600;
	}

	.value {
		font-family: monospace;
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		font-size: 0.875rem;
	}

	.button-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.test-button {
		padding: 0.75rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.test-button:hover:not(:disabled) {
		background: #2563eb;
	}

	.test-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.test-button.clear {
		background: #ef4444;
	}

	.test-button.clear:hover:not(:disabled) {
		background: #dc2626;
	}

	.test-button small {
		display: block;
		font-size: 0.75rem;
		font-weight: normal;
		opacity: 0.8;
		margin-top: 0.25rem;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		color: #6b7280;
		font-style: italic;
	}

	.loading-state p {
		margin: 0;
	}

	.behavior-list {
		margin: 0;
		padding-left: 1.5rem;
	}

	.behavior-list li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	.ui-container {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.ui-container h2 {
		margin: 0 0 1rem 0;
		color: #374151;
	}

	.right-panel-wrapper {
		height: 600px;
		background: white;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		color: #dc2626;
	}

	.error-state h3 {
		margin: 0 0 1rem 0;
	}

	.error-state p {
		margin: 0.5rem 0;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.debug-controls {
			grid-template-columns: 1fr;
		}

		.debug-page {
			padding: 1rem;
		}
	}
</style>
