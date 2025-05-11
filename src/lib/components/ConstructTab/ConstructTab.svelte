<!-- src/lib/components/ConstructTab/ConstructTab.svelte -->
<script lang="ts">
	import SharedWorkbench from '$lib/components/SequenceWorkbench/SharedWorkbench.svelte';
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import type { ButtonDefinition } from '$lib/components/SequenceWorkbench/ButtonPanel/types';

	// Props
	export let isGenerateMode = false;

	// Define Button Panel Data
	const buttonPanelButtons: ButtonDefinition[] = [
		{
			icon: 'fa-book-medical',
			title: 'Add to Dictionary',
			id: 'addToDictionary',
			color: '#4361ee'
		},
		{ icon: 'fa-save', title: 'Save Image', id: 'saveImage', color: '#3a86ff' },
		{ icon: 'fa-expand', title: 'View Full Screen', id: 'viewFullScreen', color: '#4cc9f0' },
		{
			icon: 'fa-arrows-left-right',
			title: 'Mirror Sequence',
			id: 'mirrorSequence',
			color: '#4895ef'
		},
		{ icon: 'fa-paintbrush', title: 'Swap Colors', id: 'swapColors', color: '#ff6b6b' },
		{ icon: 'fa-rotate', title: 'Rotate Sequence', id: 'rotateSequence', color: '#f72585' },
		{ icon: 'fa-trash', title: 'Delete Beat', id: 'deleteBeat', color: '#ff9e00' },
		{ icon: 'fa-eraser', title: 'Clear Sequence', id: 'clearSequence', color: '#ff7b00' }
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
	$: workbenchStore.update((state) => ({ ...state, activeTab: isGenerateMode ? 'generate' : 'construct' }));
</script>

<div class="construct-tab">
	<SharedWorkbench toolsPanelButtons={buttonPanelButtons} onToolsPanelAction={handleButtonAction} />
</div>

<style>
	.construct-tab {
		display: flex;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	@media (max-width: 768px) {
		.construct-tab {
			flex-direction: column;
		}
	}
</style>
