<!--
  Modern Architecture Test Page
  Demonstrates the new Svelte 5 architecture with service injection
  Shows performance improvements and reactive loop elimination
-->
<script lang="ts">
	import ModernServiceProvider from '$lib/providers/ModernServiceProvider.svelte';
	import SequenceWorkbenchContainer from '$lib/components/SequenceWorkbench/modern/SequenceWorkbenchContainer.svelte';
	import TestControls from './TestControls.svelte';

	// Test data and controls (services handled by TestControls component)
	let testMode = $state('normal');
	let performanceMetrics = $state({
		renderTime: 0,
		memoryUsage: 0,
		effectCount: 0
	});

	// Event handlers for TestControls component
	function handleTestModeChange(mode: string) {
		testMode = mode;
	}

	function handlePerformanceUpdate(metrics: any) {
		performanceMetrics = { ...performanceMetrics, ...metrics };
	}

	// All test functions moved to TestControls component
</script>

<svelte:head>
	<title>Modern Architecture Test - Kinetic Constructor</title>
	<meta name="description" content="Testing the modern Svelte 5 architecture" />
</svelte:head>

<ModernServiceProvider>
	<div class="test-page">
		<!-- Header -->
		<header class="test-header">
			<h1>🚀 Modern Architecture Test</h1>
			<p>Svelte 5 + Service Injection + Reactive Loop Elimination</p>
		</header>

		<!-- Test Controls (with service access) -->
		<TestControls
			{testMode}
			onTestModeChange={handleTestModeChange}
			{performanceMetrics}
			onPerformanceUpdate={handlePerformanceUpdate}
		/>

		<!-- Main Workbench -->
		<main class="workbench-container" class:performance-mode={testMode === 'performance'}>
			<SequenceWorkbenchContainer
				onBeatSelected={(beatId) => {
					console.log('Test: Beat selected:', beatId);
				}}
				onSequenceChanged={() => {
					console.log('Test: Sequence changed');
				}}
			/>
		</main>

		<!-- Architecture Info -->
		<aside class="architecture-info">
			<h3>🏗️ Architecture Features</h3>
			<ul>
				<li>✅ Svelte 5 runes ($state, $derived, $effect)</li>
				<li>✅ Service injection with dependency injection</li>
				<li>✅ Zero reactive loops</li>
				<li>✅ Performance optimized components</li>
				<li>✅ Proper cleanup and memory management</li>
				<li>✅ Accessibility compliant</li>
				<li>✅ Type-safe event handling</li>
				<li>✅ Responsive design</li>
			</ul>

			<h3>🔧 Service Status</h3>
			<div class="service-status">
				<div>Service status is shown in the Test Controls panel</div>
			</div>
		</aside>

		<!-- Footer -->
		<footer class="test-footer">
			<p>
				Modern architecture implementation -
				<a href="/WORKBENCH_NUCLEAR_REBUILD/CURRENT_ARCHITECTURE_ANALYSIS.md">
					View Architecture Analysis
				</a>
			</p>
		</footer>
	</div>
</ModernServiceProvider>

<style>
	.test-page {
		min-height: 100vh;
		display: grid;
		grid-template-areas:
			'header header'
			'controls workbench'
			'info workbench'
			'footer footer';
		grid-template-columns: 300px 1fr;
		grid-template-rows: auto auto 1fr auto;
		gap: 16px;
		padding: 16px;
		background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
	}

	.test-header {
		grid-area: header;
		text-align: center;
		padding: 24px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.test-header h1 {
		margin: 0 0 8px 0;
		color: #1e293b;
		font-size: 2rem;
	}

	.test-header p {
		margin: 0;
		color: #64748b;
		font-size: 1.1rem;
	}

	.workbench-container {
		grid-area: workbench;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		min-height: 600px;
	}

	.workbench-container.performance-mode {
		border: 2px solid #10b981;
		box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
	}

	.architecture-info {
		grid-area: info;
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.architecture-info h3 {
		margin: 0 0 12px 0;
		color: #1e293b;
		font-size: 1.1rem;
	}

	.architecture-info ul {
		margin: 0 0 24px 0;
		padding-left: 20px;
	}

	.architecture-info li {
		margin-bottom: 4px;
		color: #374151;
	}

	.service-status {
		font-family: monospace;
		font-size: 0.9rem;
	}

	.service-status div {
		margin-bottom: 4px;
	}

	.test-footer {
		grid-area: footer;
		text-align: center;
		padding: 16px;
		color: #64748b;
		font-size: 0.9rem;
	}

	.test-footer a {
		color: #3b82f6;
		text-decoration: none;
	}

	.test-footer a:hover {
		text-decoration: underline;
	}

	/* Responsive design */
	@media (max-width: 1024px) {
		.test-page {
			grid-template-areas:
				'header'
				'controls'
				'workbench'
				'info'
				'footer';
			grid-template-columns: 1fr;
			grid-template-rows: auto auto 1fr auto auto;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.test-page {
			background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
		}

		.test-header,
		.workbench-container,
		.architecture-info {
			background: #1e293b;
			color: #f1f5f9;
		}

	}
</style>
