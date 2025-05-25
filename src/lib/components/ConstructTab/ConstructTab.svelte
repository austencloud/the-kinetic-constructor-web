<!-- src/lib/components/ConstructTab/ConstructTab.svelte -->
<script lang="ts">
	import SharedWorkbench from '$lib/components/SequenceWorkbench/SharedWorkbench.svelte';
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import type { ButtonDefinition } from '$lib/components/SequenceWorkbench/ButtonPanel/types';
	import { openSequenceFullScreen } from '$lib/stores/sequence/fullScreenStore';

	interface Props {
		isGenerateMode?: boolean;
	}

	let { isGenerateMode = false }: Props = $props();

	const buttonPanelButtons: ButtonDefinition[] = [
		{
			icon: 'fa-book-medical',
			title: 'Add to Dictionary',
			id: 'addToDictionary',
			color: '#4361ee'
		},
		{ icon: 'fa-save', title: 'Save Image', id: 'saveImage', color: '#3a86ff' },
		{
			icon: 'fa-expand',
			title: 'View Sequence Full Screen',
			id: 'viewFullScreen',
			color: '#4cc9f0'
		},
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

	function handleButtonAction(id: string) {
		switch (id) {
			case 'viewFullScreen':
				openSequenceFullScreen();
				break;

			case 'constructMode':
				workbenchStore.update((state) => ({ ...state, activeTab: 'construct' }));
				break;

			case 'generateMode':
				workbenchStore.update((state) => ({ ...state, activeTab: 'generate' }));
				break;

			case 'saveImage':
				break;

			case 'addToDictionary':
				break;

			case 'mirrorSequence':
				break;

			case 'swapColors':
				break;

			case 'rotateSequence':
				break;

			case 'deleteBeat':
				break;

			case 'clearSequence':
				break;

			default:
				break;
		}
	}

	$effect(() => {
		workbenchStore.update((state) => ({
			...state,
			activeTab: isGenerateMode ? 'generate' : 'construct'
		}));
	});
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
