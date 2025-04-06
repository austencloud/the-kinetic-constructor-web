<!-- src/lib/components/OptionPicker/components/debug/LayoutDebugPanel.svelte -->
<script lang="ts">
	import type { ResponsiveLayoutConfig } from "../../optionPickerLayoutUtils";


	// Props
	export let layout: ResponsiveLayoutConfig;
	export let containerWidth: number = 0;
	export let containerHeight: number = 0;
	export let isMobileDevice: boolean = false;
	export let isPortraitMode: boolean = false;
	export let optionsCount: number = 0;
	export let selectedTab: string | null = null;
	export let showAllActive: boolean = false;

	// Toggle visibility
	let isVisible = true;
	function toggleVisibility() {
		isVisible = !isVisible;
	}

	// Format CSS properties for display
	function formatCSSValue(value: string): string {
		return value || 'none';
	}

	// Determine container aspect
	$: containerAspect = getContainerAspect(containerWidth, containerHeight);
	function getContainerAspect(width: number, height: number): string {
		if (!width || !height) return 'unknown';
		const ratio = width / height;
		if (ratio < 0.8) return 'tall';
		if (ratio > 1.3) return 'wide';
		return 'square';
	}

	// Generate grid layout visualization
	$: gridLayout = generateGridLayout(layout.gridColumns);
	function generateGridLayout(gridColumns: string): string {
		if (!gridColumns) return '';
		// Extract column count from template (e.g., "repeat(3, 1fr)" -> 3)
		const match = gridColumns.match(/repeat\((\d+)/);
		const cols = match ? parseInt(match[1]) : 1;
		
		const items = Math.min(optionsCount, 9); // Show up to 9 items for preview
		let grid = '';
		
		for (let i = 0; i < items; i++) {
			const row = Math.floor(i / cols);
			const col = i % cols;
			grid += `<div class="grid-cell" style="grid-row: ${row + 1}; grid-column: ${col + 1};">${i+1}</div>`;
		}
		
		return grid;
	}
</script>

<div class="debug-panel" class:collapsed={!isVisible}>
	<button class="toggle-button" on:click={toggleVisibility}>
		{isVisible ? 'Hide Debug' : 'Show Debug'}
	</button>
	
	{#if isVisible}
		<div class="debug-content">
			<h3>Layout Debug Information</h3>
			
			<div class="section">
				<h4>Device & Container</h4>
				<div class="info-grid">
					<div class="info-label">Device:</div>
					<div class="info-value">{isMobileDevice ? 'Mobile' : 'Desktop'}</div>
					
					<div class="info-label">Orientation:</div>
					<div class="info-value">{isPortraitMode ? 'Portrait' : 'Landscape'}</div>
					
					<div class="info-label">Container Size:</div>
					<div class="info-value">{containerWidth}px × {containerHeight}px</div>
					
					<div class="info-label">Container Aspect:</div>
					<div class="info-value">{containerAspect}</div>
				</div>
			</div>
			
			<div class="section">
				<h4>Content State</h4>
				<div class="info-grid">
					<div class="info-label">Options Count:</div>
					<div class="info-value">{optionsCount}</div>
					
					<div class="info-label">Selected Tab:</div>
					<div class="info-value">{selectedTab || 'None'}</div>
					
					<div class="info-label">Show All Active:</div>
					<div class="info-value">{showAllActive ? 'Yes' : 'No'}</div>
				</div>
			</div>
			
			<div class="section">
				<h4>Layout Configuration</h4>
				<div class="info-grid">
					<div class="info-label">Grid Columns:</div>
					<div class="info-value">{formatCSSValue(layout.gridColumns)}</div>
					
					<div class="info-label">Option Size:</div>
					<div class="info-value">{formatCSSValue(layout.optionSize)}</div>
					
					<div class="info-label">Grid Gap:</div>
					<div class="info-value">{formatCSSValue(layout.gridGap)}</div>
					
					<div class="info-label">Grid Class:</div>
					<div class="info-value">{layout.gridClass || 'None'}</div>
					

					
					<div class="info-label">Scale Factor:</div>
					<div class="info-value">{layout.scaleFactor.toFixed(2)}</div>
				</div>
			</div>
			
			<div class="section">
				<h4>Grid Preview</h4>
				<div class="grid-preview" style="grid-template-columns: {layout.gridColumns}; gap: {layout.gridGap};">
					{@html gridLayout}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.debug-panel {
		position: absolute;
		bottom: 10px;
		right: 10px;
		width: 300px;
		background-color: rgba(255, 255, 255, 0.95);
		border: 1px solid #ccc;
		border-radius: 5px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		font-family: monospace;
		font-size: 12px;
		color: #333;
		transition: all 0.3s ease;
		max-height: 80vh;
		overflow-y: auto;
	}
	
	.debug-panel.collapsed {
		width: auto;
		height: auto;
	}
	
	.toggle-button {
		position: absolute;
		top: 5px;
		right: 5px;
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 3px;
		padding: 3px 6px;
		font-size: 10px;
		cursor: pointer;
	}
	
	.debug-content {
		padding: 10px;
		padding-top: 25px;
	}
	
	h3 {
		margin: 0 0 10px 0;
		font-size: 14px;
		color: #333;
	}
	
	h4 {
		margin: 8px 0 5px 0;
		font-size: 12px;
		border-bottom: 1px solid #eee;
		padding-bottom: 3px;
	}
	
	.section {
		margin-bottom: 15px;
	}
	
	.info-grid {
		display: grid;
		grid-template-columns: 110px 1fr;
		gap: 3px;
	}
	
	.info-label {
		font-weight: bold;
		color: #555;
	}
	
	.info-value {
		color: #0066cc;
	}
	
	.grid-preview {
		display: grid;
		width: 100%;
		border: 1px dashed #ccc;
		padding: 5px;
		height: 100px;
		margin-top: 5px;
	}
	

</style>