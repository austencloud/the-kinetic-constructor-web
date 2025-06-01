<!--
  Test Controls Component
  Has access to services through ModernServiceProvider context
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import type { IWorkbenchService } from '$lib/services/core/IWorkbenchService';
	import {
		reactiveLoopValidator,
		validateReactiveLoops
	} from '$lib/utils/reactiveLoopValidator.svelte';

	// Service injection (now properly scoped within provider)
	const sequenceService = getContext<ISequenceService>('sequenceService');
	const workbenchService = getContext<IWorkbenchService>('workbenchService');

	// Props
	const props = $props<{
		testMode: string;
		onTestModeChange: (mode: string) => void;
		performanceMetrics: {
			renderTime: number;
			memoryUsage: number;
			effectCount: number;
		};
		onPerformanceUpdate: (metrics: any) => void;
	}>();

	// Verify services are available
	const servicesReady = $derived(!!sequenceService && !!workbenchService);

	// Test functions with proper service access
	function addTestBeats(count: number) {
		if (!sequenceService) {
			console.error('❌ SequenceService not available');
			alert('❌ SequenceService not available');
			return;
		}

		console.log(`🧪 Adding ${count} test beats...`);

		const beats = Array.from({ length: count }, (_, i) => ({
			id: crypto.randomUUID(),
			beatNumber: sequenceService.state.beats.length + i + 1,
			filled: Math.random() > 0.3, // 70% filled
			pictographData: null,
			blueMotionData: null,
			redMotionData: null,
			metadata: {
				blueReversal: Math.random() > 0.8,
				redReversal: Math.random() > 0.8,
				tags: []
			}
		}));

		sequenceService.addBeats(beats as any);
		console.log(`✅ Added ${count} beats successfully`);
	}

	function stressTest() {
		if (!sequenceService) {
			console.error('❌ SequenceService not available');
			return;
		}

		console.log('🧪 Starting stress test...');
		const start = performance.now();

		// Add many beats rapidly
		addTestBeats(50);

		// Rapid selections
		for (let i = 0; i < 20; i++) {
			setTimeout(() => {
				const randomBeat =
					sequenceService.state.beats[
						Math.floor(Math.random() * sequenceService.state.beats.length)
					];
				if (randomBeat?.id) {
					sequenceService.selectBeat(randomBeat.id);
				}
			}, i * 50);
		}

		const duration = performance.now() - start;
		console.log(`✅ Stress test completed in ${duration.toFixed(2)}ms`);
	}

	async function measurePerformance() {
		const start = performance.now();

		// Force a re-render by toggling test mode
		const newMode = props.testMode === 'normal' ? 'performance' : 'normal';
		props.onTestModeChange(newMode);

		setTimeout(() => {
			const renderTime = performance.now() - start;
			let memoryUsage = 0;

			if ('memory' in performance) {
				memoryUsage = (performance as any).memory.usedJSHeapSize;
			}

			props.onPerformanceUpdate({
				renderTime,
				memoryUsage,
				effectCount: 0
			});
		}, 0);
	}

	async function runReactiveLoopTest() {
		console.log('🧪 Running reactive loop validation...');
		const isValid = await validateReactiveLoops();

		if (isValid) {
			alert('✅ SUCCESS: No reactive loops detected! Architecture is stable.');
		} else {
			alert('❌ FAILURE: Reactive loops detected! Check console for details.');
		}

		console.log(reactiveLoopValidator.generateReport());
	}

	function clearSequence() {
		if (!sequenceService) {
			console.error('❌ SequenceService not available');
			return;
		}

		if (confirm('Clear all beats?')) {
			sequenceService.clearSequence();
			console.log('✅ Sequence cleared');
		}
	}

	// Debug logging
	$effect(() => {
		if (import.meta.env.DEV) {
			console.log('🔧 TestControls: Services available:', {
				sequence: !!sequenceService,
				workbench: !!workbenchService,
				ready: servicesReady
			});
		}
	});
</script>

<div class="test-controls">
	<div class="control-group">
		<h3>Test Actions</h3>

		{#if !servicesReady}
			<div class="service-warning">⚠️ Services not ready yet...</div>
		{/if}

		<button onclick={() => addTestBeats(5)} disabled={!servicesReady}> Add 5 Test Beats </button>

		<button onclick={() => addTestBeats(20)} disabled={!servicesReady}> Add 20 Test Beats </button>

		<button onclick={stressTest} disabled={!servicesReady}> 🧪 Stress Test </button>

		<button onclick={measurePerformance}> 📊 Measure Performance </button>

		<button onclick={runReactiveLoopTest}> 🔍 Validate Reactive Loops </button>

		<button onclick={clearSequence} disabled={!servicesReady}> 🗑️ Clear Sequence </button>
	</div>

	<div class="control-group">
		<h3>Test Modes</h3>
		<label>
			<input
				type="radio"
				checked={props.testMode === 'normal'}
				value="normal"
				onchange={() => props.onTestModeChange('normal')}
			/>
			Normal Mode
		</label>
		<label>
			<input
				type="radio"
				checked={props.testMode === 'performance'}
				value="performance"
				onchange={() => props.onTestModeChange('performance')}
			/>
			Performance Mode
		</label>
		<label>
			<input
				type="radio"
				checked={props.testMode === 'accessibility'}
				value="accessibility"
				onchange={() => props.onTestModeChange('accessibility')}
			/>
			Accessibility Mode
		</label>
	</div>

	<div class="control-group">
		<h3>Performance Metrics</h3>
		<div class="metrics">
			<div>Render Time: {props.performanceMetrics.renderTime.toFixed(2)}ms</div>
			<div>Memory: {(props.performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</div>
			<div>Effects: {props.performanceMetrics.effectCount}</div>
		</div>
	</div>

	<div class="control-group">
		<h3>🔧 Service Status</h3>
		<div class="service-status">
			<div>Sequence Service: {sequenceService ? '✅' : '❌'}</div>
			<div>Workbench Service: {workbenchService ? '✅' : '❌'}</div>
			<div>Services Ready: {servicesReady ? '✅' : '❌'}</div>
		</div>
	</div>
</div>

<style>
	.test-controls {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.control-group {
		margin-bottom: 24px;
	}

	.control-group h3 {
		margin: 0 0 12px 0;
		color: #1e293b;
		font-size: 1.1rem;
	}

	.control-group button {
		display: block;
		width: 100%;
		margin-bottom: 8px;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: #f9fafb;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.control-group button:hover:not(:disabled) {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.control-group button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: #f3f4f6;
	}

	.control-group label {
		display: block;
		margin-bottom: 8px;
		cursor: pointer;
	}

	.control-group input[type='radio'] {
		margin-right: 8px;
	}

	.metrics {
		font-family: monospace;
		font-size: 0.9rem;
		color: #374151;
	}

	.metrics div {
		margin-bottom: 4px;
	}

	.service-status {
		font-family: monospace;
		font-size: 0.9rem;
	}

	.service-status div {
		margin-bottom: 4px;
	}

	.service-warning {
		background: #fef3c7;
		color: #92400e;
		padding: 8px 12px;
		border-radius: 6px;
		margin-bottom: 12px;
		font-size: 0.9rem;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.test-controls {
			background: #1e293b;
			color: #f1f5f9;
		}

		.control-group button {
			background: #374151;
			border-color: #4b5563;
			color: #f1f5f9;
		}

		.service-warning {
			background: #451a03;
			color: #fbbf24;
		}
	}
</style>
