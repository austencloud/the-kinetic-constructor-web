<!-- Test page for SVG preloading performance -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { svgPreloadingService } from '$lib/services/SvgPreloadingService.svelte';
	import { pictographRenderingService } from '$lib/services/PictographRenderingService.svelte';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import type { PictographData } from '$lib/types/PictographData';

	let preloadingStatus = $state({
		isComplete: false,
		propsLoaded: false,
		arrowsLoaded: false,
		glyphsLoaded: false,
		progress: 0
	});

	let renderingStats = $state({
		totalPictographs: 0,
		readyToRender: 0,
		preloaded: 0
	});

	// Sample pictograph data for testing - using real data from test helpers
	import {
		getRandomTestPictographs,
		initializeTestDataLoader
	} from '$lib/utils/tests/pictographTestHelpers';

	let testPictographs: (PictographData & { testId: string })[] = $state([]);

	onMount(() => {
		// Load real test pictograph data asynchronously
		async function loadTestData() {
			try {
				await initializeTestDataLoader();
				const randomPictographs = await getRandomTestPictographs(3);
				console.log('Loaded test pictographs:', randomPictographs);
				testPictographs = randomPictographs.map((data, index) => {
					console.log(`Pictograph ${index + 1}:`, {
						letter: data.letter,
						redMotionData: data.redMotionData,
						blueMotionData: data.blueMotionData,
						redArrowData: data.redArrowData,
						blueArrowData: data.blueArrowData,
						redPropData: data.redPropData,
						bluePropData: data.bluePropData
					});
					return {
						...data,
						testId: `test-${index + 1}`
					};
				});
			} catch (error) {
				console.error('Failed to load test pictograph data:', error);
				// Fallback to empty array - will show message in UI
			}
		}

		loadTestData();

		// Get reactive preloading status
		const preloadingStatusRef = svgPreloadingService.getStatus();

		// Use $effect to watch for changes
		$effect(() => {
			preloadingStatus = preloadingStatusRef;
		});

		// Update rendering stats periodically
		const statsInterval = setInterval(() => {
			renderingStats = pictographRenderingService.getStats();
		}, 1000);

		return () => {
			clearInterval(statsInterval);
		};
	});

	function refreshPictographs() {
		// Force re-render pictographs to test loading
		window.location.reload();
	}

	function clearCache() {
		// Clear browser cache to test loading without preloading
		if ('caches' in window) {
			caches.keys().then((names) => {
				names.forEach((name) => {
					caches.delete(name);
				});
			});
		}
		window.location.reload();
	}

	function forceCompletePreloading() {
		// Force mark preloading as complete for testing instant rendering
		svgPreloadingService.forceComplete();
		console.log('Forced preloading complete. Status:', svgPreloadingService.isReady());
	}

	function debugPictographData() {
		console.log('Current test pictographs:', testPictographs);
		testPictographs.forEach((data, index) => {
			console.log(`Pictograph ${index + 1} detailed data:`, {
				letter: data.letter,
				gridMode: data.gridMode,
				startPos: data.startPos,
				endPos: data.endPos,
				direction: data.direction,
				redMotionData: data.redMotionData,
				blueMotionData: data.blueMotionData,
				redArrowData: data.redArrowData,
				blueArrowData: data.blueArrowData,
				redPropData: data.redPropData,
				bluePropData: data.bluePropData
			});
		});
	}
</script>

<div class="test-page">
	<h1>SVG Preloading Test Page</h1>

	<div class="status-panel">
		<h2>Preloading Status</h2>
		<div class="status-grid">
			<div class="status-item">
				<span class="label">Overall Complete:</span>
				<span class="value" class:complete={preloadingStatus.isComplete}>
					{preloadingStatus.isComplete ? '✅' : '❌'}
				</span>
			</div>
			<div class="status-item">
				<span class="label">Props Loaded:</span>
				<span class="value" class:complete={preloadingStatus.propsLoaded}>
					{preloadingStatus.propsLoaded ? '✅' : '❌'}
				</span>
			</div>
			<div class="status-item">
				<span class="label">Arrows Loaded:</span>
				<span class="value" class:complete={preloadingStatus.arrowsLoaded}>
					{preloadingStatus.arrowsLoaded ? '✅' : '❌'}
				</span>
			</div>
			<div class="status-item">
				<span class="label">Glyphs Loaded:</span>
				<span class="value" class:complete={preloadingStatus.glyphsLoaded}>
					{preloadingStatus.glyphsLoaded ? '✅' : '❌'}
				</span>
			</div>
			<div class="status-item">
				<span class="label">Progress:</span>
				<span class="value">{preloadingStatus.progress}%</span>
			</div>
		</div>
	</div>

	<div class="rendering-panel">
		<h2>Rendering Stats</h2>
		<div class="stats-grid">
			<div class="stat-item">
				<span class="label">Total Pictographs:</span>
				<span class="value">{renderingStats.totalPictographs}</span>
			</div>
			<div class="stat-item">
				<span class="label">Ready to Render:</span>
				<span class="value">{renderingStats.readyToRender}</span>
			</div>
			<div class="stat-item">
				<span class="label">Preloaded:</span>
				<span class="value">{renderingStats.preloaded}</span>
			</div>
		</div>
	</div>

	<div class="controls">
		<button onclick={refreshPictographs}>Refresh Pictographs</button>
		<button onclick={clearCache}>Clear Cache & Test</button>
		<button onclick={forceCompletePreloading}>Force Complete Preloading</button>
		<button onclick={debugPictographData}>Debug Pictograph Data</button>
	</div>

	<div class="pictographs-container">
		<h2>Test Pictographs</h2>
		<p>
			Watch for instant rendering when SVGs are preloaded vs. sequential loading when they're not.
		</p>

		{#if testPictographs.length === 0}
			<div class="loading-message">
				<p>Loading real pictograph data with arrows and props...</p>
			</div>
		{:else}
			<div class="pictographs-grid">
				{#each testPictographs as pictographData (pictographData.testId)}
					<div class="pictograph-wrapper">
						<h3>Pictograph {pictographData.testId}</h3>
						<div class="pictograph-info">
							<p><strong>Letter:</strong> {pictographData.letter || 'None'}</p>
							<p>
								<strong>Red Motion:</strong>
								{pictographData.redMotionData?.motionType || 'None'}
							</p>
							<p>
								<strong>Blue Motion:</strong>
								{pictographData.blueMotionData?.motionType || 'None'}
							</p>
						</div>
						<Pictograph
							{pictographData}
							disableAnimations={preloadingStatus.isComplete}
							showLoadingIndicator={!preloadingStatus.isComplete}
						/>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.test-page {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		min-height: 100vh;
		overflow-y: auto;
	}

	.status-panel,
	.rendering-panel {
		background: #f5f5f5;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.status-grid,
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.status-item,
	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: white;
		border-radius: 4px;
	}

	.label {
		font-weight: 600;
	}

	.value {
		font-family: monospace;
	}

	.value.complete {
		color: green;
		font-weight: bold;
	}

	.controls {
		margin-bottom: 2rem;
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	button {
		background: #007acc;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	button:hover {
		background: #005a9e;
	}

	.pictographs-container {
		background: #f9f9f9;
		border-radius: 8px;
		padding: 2rem;
	}

	.pictographs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-top: 1rem;
	}

	.pictograph-wrapper {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.pictograph-wrapper h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #333;
	}

	.pictograph-info {
		margin-bottom: 1rem;
		padding: 0.5rem;
		background: #f8f9fa;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.pictograph-info p {
		margin: 0.25rem 0;
	}

	.loading-message {
		text-align: center;
		padding: 2rem;
		color: #666;
		font-style: italic;
	}
</style>
