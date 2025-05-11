<!-- src/lib/components/GenerateTab/layout/GenerateTabContent.svelte -->
<script lang="ts">
	import SharedWorkbench from '$lib/components/SequenceWorkbench/SharedWorkbench.svelte';
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import type { ButtonDefinition } from '$lib/components/SequenceWorkbench/ButtonPanel/types';

	// Define Button Panel Data
	const buttonPanelButtons: ButtonDefinition[] = [
		{
			icon: 'fa-book-medical',
			title: 'Add to Dictionary',
			id: 'addToDictionary',
			color: '#4361ee'
		},
		{ icon: 'fa-save', title: 'Save Image', id: 'saveImage', color: '#3a86ff' },
		{ icon: 'fa-expand', title: 'View Full Screen', id: 'viewFullScreen', color: '#4cc9f0' }
	];

	// Handler for button panel actions
	function handleButtonAction(id: string) {
		const buttonEvent = new CustomEvent('action', {
			detail: { id },
			bubbles: true,
			cancelable: true,
			composed: true
		});
		document.dispatchEvent(buttonEvent);
	}

	// Set active tab when component mounts
	$: workbenchStore.update((state) => ({ ...state, activeTab: 'generate' }));
</script>

<div class="generate-tab-content">
	<SharedWorkbench {buttonPanelButtons} onToolsPanelAction={handleButtonAction} />
</div>

<style>
	.generate-tab-content {
		display: flex;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
	}

	@media (max-width: 732px) {
		.generate-tab-content {
			flex-direction: column;
		}
	}
</style>
