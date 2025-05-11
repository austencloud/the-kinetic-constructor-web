<!-- src/lib/components/SequenceWorkbench/RightPanel/RightPanel.svelte -->
<script lang="ts">
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import ButtonPanel from '../ButtonPanel/ActionToolbar.svelte';
	import ModernGenerationControls from './ModernGenerationControls.svelte';
	import OptionPicker from '$lib/components/ConstructTab/OptionPicker/OptionPicker.svelte';
	import type { ButtonDefinition } from '../ButtonPanel/types';

	// Props
	export let toolsPanelOpen: boolean;
	export let toolsPanelButtons: ButtonDefinition[];
	export let onToolsPanelAction: (id: string) => void;
</script>

<div class="right-panel">
	{#if $workbenchStore.activeTab === 'generate'}
		<ModernGenerationControls />
	{:else}
		<OptionPicker />
	{/if}

	{#if toolsPanelOpen}
		<ButtonPanel
			buttons={toolsPanelButtons}
			containerWidth={200}
			containerHeight={400}
			on:action={(e) => onToolsPanelAction(e.detail.id)}
		/>
	{/if}
</div>

<style>
	.right-panel {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}
</style>
