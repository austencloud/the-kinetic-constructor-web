<!-- src/lib/components/GenerateTab/layout/GenerateTabContent.svelte -->
<script lang="ts">
	// Import layout components
	import WorkbenchPanel from './WorkbenchPanel.svelte';
	import ControlsPanel from './ControlsPanelComponent.svelte';

	// Use both old and new state management during migration
	export let useNewStateManagement = true;
</script>

<div class="generate-tab-content">
	<!-- Left panel: Sequence Workbench -->
	<WorkbenchPanel />

	<!-- Right panel: Controls -->
	<ControlsPanel {useNewStateManagement} />
</div>

<style>
	.generate-tab-content {
		display: flex;
		flex: 1;
		gap: 1.5rem;
		min-height: 0;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}

	/* Responsive adjustments */
	@media (max-width: 1024px) {
		.generate-tab-content {
			flex-direction: column;
		}
	}
</style>
