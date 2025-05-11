<!-- src/lib/components/SequenceWorkbench/SharedWorkbench.svelte -->
<script lang="ts">
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import SequenceWorkbench from './Workbench.svelte';
	import RightPanel from './RightPanel/RightPanel.svelte';
	import type { ButtonDefinition } from './ButtonPanel/types';

	// Props
	export let toolsPanelButtons: ButtonDefinition[];
	export let onToolsPanelAction: (id: string) => void;

	// Function to close tools panel
	function closeToolsPanel() {
		workbenchStore.update((state) => ({ ...state, toolsPanelOpen: false }));
	}
</script>

<div class="shared-workbench">
	<div class="sequenceWorkbenchContainer">
		<SequenceWorkbench
			toolsPanelOpen={$workbenchStore.toolsPanelOpen}
			on:toggleToolsPanel={() =>
				workbenchStore.update((state) => ({ ...state, toolsPanelOpen: !state.toolsPanelOpen }))}
		/>
	</div>
	<div class="optionPickerContainer">
		<RightPanel
			toolsPanelOpen={$workbenchStore.toolsPanelOpen}
			{toolsPanelButtons}
			{onToolsPanelAction}
			onToolsPanelClose={closeToolsPanel}
		/>
	</div>
</div>

<style>
	.shared-workbench {
		display: flex;
		flex: 1;
		gap: 1.5rem;
		min-height: 0;
		overflow: hidden;
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
	}

	.sequenceWorkbenchContainer {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
		position: relative;
	}

	.optionPickerContainer {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
		box-sizing: border-box;
	}

	@media (max-width: 732px) {
		.shared-workbench {
			flex-direction: column;
		}

		.sequenceWorkbenchContainer {
			flex: 1;
			height: 50%;
		}

		.optionPickerContainer {
			flex: 1;
			height: 50%;
		}
	}
</style>
