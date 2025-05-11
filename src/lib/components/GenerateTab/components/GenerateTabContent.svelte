<!-- src/lib/components/GenerateTab/layout/GenerateTabContent.svelte -->
<script lang="ts">
	import { writable } from 'svelte/store';
	import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
	import RightPanel from '$lib/components/SequenceWorkbench/RightPanel/RightPanel.svelte';
	import type { ButtonDefinition } from '$lib/components/SequenceWorkbench/ButtonPanel/types';
	import SharedWorkbench from '$lib/components/SequenceWorkbench/SharedWorkbench.svelte';

	// Track tools panel state
	const isToolsPanelOpen = writable(false);

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

		// After action is processed, close tools panel
		if ($isToolsPanelOpen) {
			isToolsPanelOpen.set(false);
		}
	}

	// Function to close tools panel
	function closeToolsPanel() {
		isToolsPanelOpen.set(false);
	}

	// Note: The RightPanel component will automatically set its active tab to 'generate'
	// when it detects it's being used in the GenerateTab
</script>

<div class="generate-tab-content">
	<SharedWorkbench toolsPanelButtons={buttonPanelButtons} onToolsPanelAction={handleButtonAction} />
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
		width: 100%;
		height: 100%;
	}

	/* Responsive adjustments */
	@media (max-width: 732px) {
		.generate-tab-content {
			flex-direction: column;
		}
	}
</style>
