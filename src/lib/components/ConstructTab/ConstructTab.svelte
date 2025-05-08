<!-- src/lib/components/ConstructTab/ConstructTab.svelte -->
<script lang="ts">
	import { derived, writable } from 'svelte/store';
	import { fade, crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
	import OptionPicker from './OptionPicker/OptionPicker.svelte';
	import StartPosPicker from './StartPosPicker/StartPosPicker.svelte';
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';

	// Import for button definition types
	import type {
		ButtonDefinition,
		ActionEventDetail
	} from '$lib/components/SequenceWorkbench/ButtonPanel/types';

	import ToolsPanel from '../SequenceWorkbench/ToolsPanel/ToolsPanel.svelte';

	// Track tools panel state
	const isToolsPanelOpen = writable(false);

	// Derived store to determine which picker to show
	const isEmpty = derived(isSequenceEmpty, ($isEmpty) => $isEmpty);

	// Create crossfade transition
	const [send, receive] = crossfade({
		duration: 300,
		easing: cubicOut,
		fallback(node, _params) {
			return fade(node, {
				duration: 300,
				easing: cubicOut
			});
		}
	});

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
	function handleButtonAction(event: CustomEvent<ActionEventDetail>) {
		const buttonEvent = new CustomEvent('action', {
			detail: event.detail,
			bubbles: true,
			cancelable: true,
			composed: true // Ensures the event can cross shadow DOM boundaries if needed
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

	// Track if we're showing the start position picker due to an immediate click
	const showingStartPosPicker = writable(false);

	// Listen for the start position click event for immediate feedback
	onMount(() => {
		const handleStartPosClick = (event: CustomEvent) => {
			if (event.detail?.immediate) {
				// Force the start position picker to show immediately
				showingStartPosPicker.set(true);
			}
		};

		document.addEventListener('start-position-click', handleStartPosClick as EventListener);

		return () => {
			document.removeEventListener('start-position-click', handleStartPosClick as EventListener);
		};
	});
</script>

<div class="construct-tab">
	<div class="sequenceWorkbenchContainer">
		<SequenceWorkbench />
	</div>
	<div class="optionPickerContainer">
		{#if $isToolsPanelOpen}
			<div class="picker-container" in:receive={{ key: 'tools' }} out:send={{ key: 'tools' }}>
				<ToolsPanel
					buttons={buttonPanelButtons}
					on:action={handleButtonAction}
					on:close={closeToolsPanel}
				/>
			</div>
		{:else if $isEmpty || $showingStartPosPicker}
			<div class="picker-container" in:receive={{ key: 'startpos' }} out:send={{ key: 'startpos' }}>
				<StartPosPicker />
			</div>
		{:else}
			<div class="picker-container" in:receive={{ key: 'options' }} out:send={{ key: 'options' }}>
				<OptionPicker />
			</div>
		{/if}
	</div>
</div>

<style>
	.construct-tab {
		display: flex;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.sequenceWorkbenchContainer {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
		position: relative; /* For tools button positioning */
	}

	.optionPickerContainer {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.picker-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
	}

	@media (max-width: 768px) {
		.construct-tab {
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
