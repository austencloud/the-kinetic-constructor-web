<!--
  Debug page for testing the reactive chain:
  StartPositionPicker → SequenceService → ModernBeatGrid
-->
<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import type { SequenceService } from '$lib/services/SequenceService.svelte';
	import StartPositionPicker from '$lib/components/ConstructTab/OptionPicker/components/StartPositionPicker.svelte';
	import ModernBeatGrid from '$lib/components/SequenceWorkbench/BeatFrame/modern/ModernBeatGrid.svelte';

	// Get the sequence service from context
	const sequenceService = getContext<SequenceService>('sequenceService');

	// Debug state
	let debugInfo = $state({
		sequenceServiceAvailable: false,
		startPosition: null as any,
		beats: 0,
		isEmpty: true,
		isModified: false
	});

	// Container dimensions
	let containerWidth = $state(800);
	let containerHeight = $state(600);

	// Update debug info when sequence service state changes
	$effect(() => {
		if (sequenceService) {
			debugInfo.sequenceServiceAvailable = true;
			debugInfo.startPosition = sequenceService.state.startPosition;
			debugInfo.beats = sequenceService.state.beats.length;
			debugInfo.isEmpty = sequenceService.isEmpty;
			debugInfo.isModified = sequenceService.state.isModified;

			console.log('🔍 Debug Page: SequenceService state changed:', debugInfo);
		}
	});

	// Test functions
	function testSetStartPosition() {
		if (!sequenceService) {
			console.error('❌ SequenceService not available');
			return;
		}

		const mockStartPosition = {
			letter: 'α1',
			startPos: 'n',
			endPos: 'n',
			grid: 'diamond',
			redPropData: {
				prop: 'staff',
				hand: 'right',
				location: 'n'
			},
			bluePropData: {
				prop: 'staff',
				hand: 'left',
				location: 'n'
			},
			redMotionData: {
				motionType: 'static',
				startOri: 'in',
				endOri: 'in',
				location: 'n'
			},
			blueMotionData: {
				motionType: 'static',
				startOri: 'in',
				endOri: 'in',
				location: 'n'
			}
		} as any;

		console.log('🧪 Testing setStartPosition with mock data:', mockStartPosition);
		sequenceService.setStartPosition(mockStartPosition);
	}

	function clearStartPosition() {
		if (!sequenceService) {
			console.error('❌ SequenceService not available');
			return;
		}

		console.log('🧪 Clearing start position');
		sequenceService.setStartPosition(null);
	}

	function clearSequence() {
		if (!sequenceService) {
			console.error('❌ SequenceService not available');
			return;
		}

		console.log('🧪 Clearing entire sequence');
		sequenceService.clearSequence();
	}

	onMount(() => {
		console.log('🔍 Debug Page: Mounted with sequenceService:', !!sequenceService);

		// Expose debug functions globally
		if (typeof window !== 'undefined') {
			(window as any).debugReactiveChain = {
				testSetStartPosition,
				clearStartPosition,
				clearSequence,
				getDebugInfo: () => debugInfo,
				getSequenceService: () => sequenceService
			};
			console.log('🔍 Debug functions exposed as window.debugReactiveChain');
		}
	});
</script>

<div class="debug-page">
	<h1>🔍 Reactive Chain Debug Page</h1>

	<div class="debug-info">
		<h2>Debug Information</h2>
		<div class="info-grid">
			<div class="info-item">
				<strong>SequenceService Available:</strong>
				<span class={debugInfo.sequenceServiceAvailable ? 'success' : 'error'}>
					{debugInfo.sequenceServiceAvailable ? '✅ Yes' : '❌ No'}
				</span>
			</div>
			<div class="info-item">
				<strong>Start Position:</strong>
				<span>{debugInfo.startPosition?.letter || 'null'}</span>
			</div>
			<div class="info-item">
				<strong>Beats Count:</strong>
				<span>{debugInfo.beats}</span>
			</div>
			<div class="info-item">
				<strong>Is Empty:</strong>
				<span>{debugInfo.isEmpty ? 'Yes' : 'No'}</span>
			</div>
			<div class="info-item">
				<strong>Is Modified:</strong>
				<span>{debugInfo.isModified ? 'Yes' : 'No'}</span>
			</div>
		</div>
	</div>

	<div class="test-controls">
		<h2>Test Controls</h2>
		<div class="button-group">
			<button onclick={testSetStartPosition}>🧪 Set Mock Start Position</button>
			<button onclick={clearStartPosition}>🗑️ Clear Start Position</button>
			<button onclick={clearSequence}>🗑️ Clear Sequence</button>
		</div>
	</div>

	<div class="components-section">
		<div class="component-container">
			<h2>StartPositionPicker</h2>
			<div class="component-wrapper">
				<StartPositionPicker />
			</div>
		</div>

		<div class="component-container">
			<h2>ModernBeatGrid</h2>
			<div class="component-wrapper">
				<ModernBeatGrid
					{containerWidth}
					{containerHeight}
					isScrollable={false}
					fullScreenMode={false}
					onBeatClick={(beatId) => console.log('🔍 Beat clicked:', beatId)}
					onBeatDoubleClick={(beatId) => console.log('🔍 Beat double-clicked:', beatId)}
					onStartPosClick={() => console.log('🔍 Start position clicked')}
				/>
			</div>
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

	h1 {
		color: #333;
		border-bottom: 2px solid #007bff;
		padding-bottom: 0.5rem;
	}

	h2 {
		color: #555;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}

	.debug-info {
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: white;
		border-radius: 4px;
		border: 1px solid #e9ecef;
	}

	.success {
		color: #28a745;
		font-weight: bold;
	}

	.error {
		color: #dc3545;
		font-weight: bold;
	}

	.test-controls {
		background: #e9ecef;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		background: #007bff;
		color: white;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	button:hover {
		background: #0056b3;
	}

	.components-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.component-container {
		border: 1px solid #dee2e6;
		border-radius: 8px;
		overflow: hidden;
	}

	.component-container h2 {
		margin: 0;
		padding: 1rem;
		background: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
	}

	.component-wrapper {
		padding: 1rem;
		min-height: 300px;
		background: white;
	}

	@media (max-width: 768px) {
		.components-section {
			grid-template-columns: 1fr;
		}

		.button-group {
			flex-direction: column;
		}
	}
</style>
