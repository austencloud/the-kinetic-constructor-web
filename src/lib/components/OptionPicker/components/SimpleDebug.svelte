<script lang="ts">
	import { fade } from 'svelte/transition';
	import { getContainerAspect, type DeviceType, type ResponsiveLayoutConfig } from '../config';

	// Props - grouped into logical objects
	export let deviceType: DeviceType;
	export let isPortraitMode: boolean;
	export let isMobileDevice: boolean;

	export let layout: ResponsiveLayoutConfig;

	export let containerWidth: number;
	export let containerHeight: number;

	export let optionsCount: number;
	export let selectedTab: string | null;
	export let showAllActive: boolean;

	// Control callbacks
	export let toggleDeviceState: () => void;
	export let toggleOrientationState: () => void;

	// Panel state
	let isDebugExpanded = false;

	// Panel toggle handler
	const toggleDebugPanel = () => (isDebugExpanded = !isDebugExpanded);

	// Derived values
	$: containerAspect = getContainerAspect(containerWidth, containerHeight);
	$: gridTemplateColumns = layout.gridColumns;
</script>

<div class="debug-container" data-testid="debug-panel">
	<div class="debug-bar">
		<button class="debug-button" on:click={toggleDeviceState} aria-label="Toggle device type">
			Device: {deviceType}
			{isMobileDevice ? '📱' : '💻'}
		</button>

		<button class="debug-button" on:click={toggleOrientationState} aria-label="Toggle orientation">
			{isPortraitMode ? 'Portrait 📸' : 'Landscape 🌄'}
		</button>

		<div class="spacer"></div>

		<button
			class="debug-button toggle-button"
			on:click={toggleDebugPanel}
			aria-expanded={isDebugExpanded}
			aria-controls="debug-details"
		>
			{isDebugExpanded ? 'Hide Details ▲' : 'Show Details ▼'}
		</button>
	</div>

	{#if isDebugExpanded}
		<div id="debug-details" class="debug-details" transition:fade={{ duration: 200 }}>
			<section class="debug-section">
				<h4>Container</h4>
				<div class="grid">
					<div>Size:</div>
					<div>{containerWidth}×{containerHeight}px</div>
					<div>Aspect:</div>
					<div>{containerAspect}</div>
				</div>
			</section>

			<section class="debug-section">
				<h4>Content</h4>
				<div class="grid">
					<div>Options:</div>
					<div>{optionsCount}</div>
					<div>Selected Tab:</div>
					<div>{selectedTab || 'None'}</div>
					<div>Show All:</div>
					<div>{showAllActive ? 'Yes' : 'No'}</div>
				</div>
			</section>

			<section class="debug-section">
				<h4>Layout</h4>
				<div class="grid">
					<div>Columns:</div>
					<div>{layout.gridColumns}</div>
					<div>Option Size:</div>
					<div>{layout.optionSize}</div>
					<div>Grid Gap:</div>
					<div>{layout.gridGap}</div>
					<div>Scale:</div>
					<div>{layout.scaleFactor.toFixed(2)}</div>
				</div>
			</section>

			<section class="debug-section">
				<h4>Grid Preview</h4>
				<div class="grid-preview" style="grid-template-columns: {gridTemplateColumns}">
					{#each Array(Math.min(optionsCount, 12)) as _, i}
						<div class="preview-cell">{i + 1}</div>
					{/each}
				</div>
			</section>
		</div>
	{/if}
</div>

<style>
	.debug-container {
		position: relative;
		margin-bottom: 10px;
		background-color: #f8fafc;
		border-radius: 4px;
		border: 1px dashed #94a3b8;
		overflow: hidden;
		font-size: 12px;
		font-family: ui-monospace, monospace;
	}

	.debug-bar {
		display: flex;
		padding: 6px;
		background-color: #f1f5f9;
		gap: 6px;
		flex-wrap: wrap;
	}

	.debug-button {
		background-color: #2563eb;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 4px 8px;
		font-size: 11px;
		cursor: pointer;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.debug-button:hover {
		background-color: #1d4ed8;
	}

	.toggle-button {
		background-color: #0891b2;
	}

	.toggle-button:hover {
		background-color: #0e7490;
	}

	.spacer {
		flex-grow: 1;
	}

	.debug-details {
		padding: 10px;
	}

	.debug-section {
		margin-bottom: 12px;
	}

	.debug-section h4 {
		margin: 0 0 6px 0;
		padding-bottom: 3px;
		border-bottom: 1px solid #e2e8f0;
		font-size: 12px;
		color: #334155;
	}

	.grid {
		display: grid;
		grid-template-columns: 100px 1fr;
		gap: 4px;
		align-items: center;
	}

	.grid > div:nth-child(odd) {
		font-weight: 600;
		color: #475569;
	}

	.grid > div:nth-child(even) {
		color: #0369a1;
	}

	.grid-preview {
		display: grid;
		gap: 4px;
		width: 100%;
		border: 1px dashed #cbd5e1;
		padding: 4px;
		height: 80px;
		margin-top: 5px;
	}

	.preview-cell {
		background-color: #bfdbfe;
		color: #1e40af;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 2px;
		font-weight: 600;
	}

	@media (max-width: 600px) {
		.debug-bar {
			flex-direction: column;
			align-items: stretch;
		}

		.debug-button {
			margin-bottom: 4px;
		}
	}
</style>
