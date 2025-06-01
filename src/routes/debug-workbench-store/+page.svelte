<!--
  Debug Workbench Store Test Page
  Tests the workbench store state and tab switching
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import RightPanel from '$lib/components/SequenceWorkbench/RightPanel/RightPanel.svelte';
	import ModernServiceProvider from '$lib/providers/ModernServiceProvider.svelte';

	// Reactive state
	let currentWorkbenchState = $state($workbenchStore);
	
	// Subscribe to workbench store changes
	$effect(() => {
		const unsubscribe = workbenchStore.subscribe(state => {
			currentWorkbenchState = state;
			console.log('📊 Workbench store updated:', state);
		});
		return unsubscribe;
	});

	// Test functions
	function setConstructTab() {
		console.log('🎯 Setting workbench to construct tab');
		workbenchStore.update(state => ({
			...state,
			activeTab: 'construct'
		}));
	}

	function setGenerateTab() {
		console.log('🎯 Setting workbench to generate tab');
		workbenchStore.update(state => ({
			...state,
			activeTab: 'generate'
		}));
	}

	onMount(() => {
		console.log('🚀 Debug Workbench Store Page mounted');
		console.log('📊 Initial workbench state:', $workbenchStore);
	});
</script>

<svelte:head>
	<title>Debug Workbench Store</title>
</svelte:head>

<div class="debug-page">
	<header class="debug-header">
		<h1>🔍 Workbench Store Debug Page</h1>
		<p>Test workbench store state and RightPanel conditional rendering</p>
	</header>

	<div class="debug-controls">
		<div class="control-section">
			<h2>📊 Current Workbench State</h2>
			<div class="state-display">
				<div class="state-item">
					<strong>Active Tab:</strong>
					<span class="value" class:construct={currentWorkbenchState.activeTab === 'construct'} class:generate={currentWorkbenchState.activeTab === 'generate'}>
						{currentWorkbenchState.activeTab}
					</span>
				</div>
				<div class="state-item">
					<strong>Tools Panel Open:</strong>
					<span class="value">{currentWorkbenchState.toolsPanelOpen ? 'Yes' : 'No'}</span>
				</div>
			</div>
		</div>

		<div class="control-section">
			<h2>🎮 Test Controls</h2>
			<div class="button-grid">
				<button
					class="test-button construct"
					onclick={setConstructTab}
				>
					Set Construct Tab
				</button>
				<button
					class="test-button generate"
					onclick={setGenerateTab}
				>
					Set Generate Tab
				</button>
			</div>
		</div>

		<div class="control-section">
			<h2>📝 Expected Behavior</h2>
			<ul class="behavior-list">
				<li>
					<strong>Construct Tab:</strong> Should show StartPositionPicker/OptionPicker (TransitionWrapper)
				</li>
				<li>
					<strong>Generate Tab:</strong> Should show ModernGenerationControls
				</li>
				<li>
					<strong>Console logs:</strong> Should show workbench store updates and RightPanel state
				</li>
			</ul>
		</div>
	</div>

	<div class="ui-container">
		<h2>🖼️ RightPanel Component</h2>
		<div class="right-panel-wrapper">
			<ModernServiceProvider>
				<RightPanel />
			</ModernServiceProvider>
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

	.value {
		font-family: monospace;
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.value.construct {
		background: #dcfce7;
		color: #166534;
	}

	.value.generate {
		background: #fef3c7;
		color: #92400e;
	}

	.button-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.test-button {
		padding: 0.75rem 1rem;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.test-button.construct {
		background: #059669;
	}

	.test-button.construct:hover {
		background: #047857;
	}

	.test-button.generate {
		background: #d97706;
	}

	.test-button.generate:hover {
		background: #b45309;
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

	@media (max-width: 768px) {
		.debug-controls {
			grid-template-columns: 1fr;
		}

		.debug-page {
			padding: 1rem;
		}
	}
</style>
