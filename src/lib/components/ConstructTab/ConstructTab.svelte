<!-- src/lib/components/ConstructTab/ConstructTab.svelte -->
<script lang="ts">
	import SharedWorkbench from '$lib/components/SequenceWorkbench/SharedWorkbench.svelte';
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import type { ButtonDefinition } from '$lib/components/SequenceWorkbench/ButtonPanel/types';
	import { openSequenceFullScreen } from '$lib/stores/sequence/fullScreenStore';

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

	// Handler for button panel actions
	function handleButtonAction(id: string) {
		// Handle the action directly without dispatching any events
		// This prevents the infinite recursion loop

		// Handle specific actions based on the button ID
		switch (id) {
			case 'viewFullScreen':
				// Use the fullScreenStore to open the fullscreen overlay
				openSequenceFullScreen();
				break;

			case 'constructMode':
				workbenchStore.update((state) => ({ ...state, activeTab: 'construct' }));
				break;

			case 'generateMode':
				workbenchStore.update((state) => ({ ...state, activeTab: 'generate' }));
				break;

			case 'saveImage':
				// Implement save image functionality here
				break;

			case 'addToDictionary':
				// Implement add to dictionary functionality here
				break;

			case 'mirrorSequence':
				// Implement mirror sequence functionality here
				break;

			case 'swapColors':
				// Implement swap colors functionality here
				break;

			case 'rotateSequence':
				// Implement rotate sequence functionality here
				break;

			case 'deleteBeat':
				// Implement delete beat functionality here
				break;

			case 'clearSequence':
				// Implement clear sequence functionality here
				break;

			default:
				// Handle any other actions
				break;
		}
	}

	// Set active tab when component mounts
	$: {
		const newTab = isGenerateMode ? 'generate' : 'construct';
		if (import.meta.env.DEV) {
			console.log('🏗️ ConstructTab setting workbench tab:', {
				isGenerateMode,
				newTab,
				currentTab: $workbenchStore.activeTab
			});
		}
		workbenchStore.update((state) => ({
			...state,
			activeTab: newTab
		}));
	}
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
