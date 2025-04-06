<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import LayoutDebugPanel from './LayoutDebugPanel.svelte';
	import type { DeviceType } from '../../utils/deviceUtils';
	import type { ResponsiveLayoutConfig } from '../../utils/layoutConfig/layoutUtils';

	// --- Props ---
	// Data passed down for display and context
	export let deviceType: DeviceType;
	export let isPortraitMode: boolean;
	export let layout: ResponsiveLayoutConfig; // Needed for LayoutDebugPanel
	export let containerWidth: number; // Needed for LayoutDebugPanel
	export let containerHeight: number; // Needed for LayoutDebugPanel
	export let optionsCount: number; // Needed for LayoutDebugPanel
	export let selectedTab: string | null; // Needed for LayoutDebugPanel
	export let showAllActive: boolean; // Needed for LayoutDebugPanel
	export let isMobileDevice: boolean; // Needed for LayoutDebugPanel

	// Functions passed down from the parent to trigger state changes
	export let toggleDeviceState: () => void;
	export let toggleOrientationState: () => void;

	// --- State ---
	let isDebugPanelCollapsed: boolean = true; // Internal state for the collapsible panel

	// --- Functions ---
	function toggleDebugPanel() {
		isDebugPanelCollapsed = !isDebugPanelCollapsed;
	}
</script>

<div class="debug-controls-wrapper">
	<div class="debug-controls">
		<button class="debug-button" on:click={toggleDeviceState}>
			Toggle Device:
			{#if deviceType === 'smallMobile'}
				Small Mobile 📱🔬
			{:else if deviceType === 'mobile'}
				Mobile 📱
			{:else if deviceType === 'tablet'}
				Tablet 📲
			{:else if deviceType === 'desktop'}
				Desktop 💻
			{:else if deviceType === 'largeDesktop'}
				Large Desktop 🖥️
			{/if}
		</button>

		<button class="debug-button" on:click={toggleOrientationState}>
			Toggle Orientation: {isPortraitMode ? 'Portrait 📸' : 'Landscape 🌄'}
		</button>

		<div class="debug-info">
			Current Device:
			{#if deviceType === 'smallMobile'}
				Small Mobile 📱🔬
			{:else if deviceType === 'mobile'}
				Mobile 📱
			{:else if deviceType === 'tablet'}
				Tablet 📲
			{:else if deviceType === 'desktop'}
				Desktop 💻
			{:else if deviceType === 'largeDesktop'}
				Large Desktop 🖥️
			{/if}
			, Orientation: {isPortraitMode ? 'Portrait 📸' : 'Landscape 🌄'}
		</div>

		<button class="debug-button debug-toggle-button" on:click={toggleDebugPanel}>
			{isDebugPanelCollapsed ? 'Show Layout Debug' : 'Hide Layout Debug'}
			{isDebugPanelCollapsed ? '🔽' : '🔼'}
		</button>
	</div>

	{#if !isDebugPanelCollapsed}
		<div class="debug-panel-container" transition:fade={{ duration: 200 }}>
			<LayoutDebugPanel
				{layout}
				{containerWidth}
				{containerHeight}
				{isMobileDevice}
				{isPortraitMode}
				{optionsCount}
				{selectedTab}
				{showAllActive}
			/>
		</div>
	{/if}
</div>

<style>
	.debug-controls-wrapper {
		/* Styles for the overall wrapper if needed */
		margin-bottom: 10px;
	}

	.debug-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 8px;
		background-color: #f0f7ff; /* Light blue background */
		border-radius: 4px;
		border: 1px dashed #99ccff; /* Dashed blue border */
		color: #333; /* Darker text color */
		font-size: 12px; /* Consistent font size */
	}

	.debug-button {
		background-color: #2563eb; /* Blue */
		color: white;
		border: none;
		border-radius: 4px;
		padding: 6px 12px;
		font-size: 12px;
		cursor: pointer;
		transition: background-color 0.2s;
		flex-shrink: 0; /* Prevent buttons from shrinking too much */
	}

	.debug-button:hover {
		background-color: #1d4ed8; /* Darker blue on hover */
	}

	.debug-info {
		display: flex;
		align-items: center;
		padding: 6px 0; /* Align vertically with buttons */
		flex-grow: 1; /* Allow info to take up space */
		min-width: 150px; /* Prevent excessive wrapping */
	}

	.debug-toggle-button {
		background-color: #10b981; /* Teal color */
		margin-left: auto; /* Push it to the right on wider screens */
	}
	.debug-toggle-button:hover {
		background-color: #059669; /* Darker teal on hover */
	}

	.debug-panel-container {
		margin-top: 8px; /* Space between controls and panel */
		border: 1px solid #e2e8f0; /* Light border for the panel */
		border-radius: 4px;
		overflow: hidden; /* Ensures panel stays within bounds */
	}

	/* Responsive adjustments */
	@media (max-width: 600px) { /* Adjust breakpoint as needed */
		.debug-controls {
			flex-direction: column; /* Stack controls vertically */
			align-items: stretch; /* Make items full width */
		}
		.debug-toggle-button {
			margin-left: 0; /* Reset margin */
		}
		.debug-info {
			order: -1; /* Move info to the top */
			margin-bottom: 4px;
		}
	}
</style>
