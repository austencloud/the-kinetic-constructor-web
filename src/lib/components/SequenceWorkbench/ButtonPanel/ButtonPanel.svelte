<script lang="ts">
	import { handleButtonAction } from './ButtonPanelLogic';
	import type { ActionEventDetail } from './types';
	import { openSequenceOverlay } from '$lib/state/sequenceOverlay/sequenceOverlayState';
	import { appActions } from '$lib/state/machines/app/app.actions';
	import * as sequenceActions from '$lib/state/machines/sequenceMachine/actions';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { onMount, onDestroy } from '$lib/utils/svelte-lifecycle';

	// Components
	import ClearSequenceButton from '../ClearSequenceButton.svelte';
	import RemoveBeatButton from '../RemoveBeatButton.svelte';
	import SequenceOverlayButton from '../SequenceOverlayButton.svelte';
	import ShareButton from '../share/ShareButton.svelte';
	import SettingsButton from '$lib/components/MenuBar/SettingsButton/SettingsButton.svelte';

	// Props
	const {
		beatFrameElement = $bindable<HTMLElement | null>(null),
		buttonSizeFactor = $bindable(1)
	} = $props<{
		beatFrameElement?: HTMLElement | null;
		buttonSizeFactor?: number;
	}>();

	// Track the active mode
	let activeMode = $state<'construct' | 'generate'>('construct');

	// Handle button actions
	function handleButtonActionWrapper(event: CustomEvent<ActionEventDetail>) {
		handleButtonAction({
			id: event.detail.id,
			activeMode,
			setActiveMode: (mode) => {
				activeMode = mode;
			},
			openFullScreen: openSequenceOverlay
		});
	}

	// Handle remove beat button click
	function handleRemoveBeat() {
		// Get the selected beat ID from the sequence container
		const selectedBeatIds = sequenceContainer.state.selectedBeatIds;
		if (selectedBeatIds.length > 0) {
			// Create the event object expected by the action
			const event = { type: 'REMOVE_BEAT_AND_FOLLOWING', beatId: selectedBeatIds[0] };
			sequenceActions.removeBeatAndFollowing({ event });
		}
	}

	function handleClearSequence() {
		const event = new CustomEvent<ActionEventDetail>('action', {
			detail: { id: 'clearSequence' }
		});
		handleButtonActionWrapper(event);
	}

	function handleSettingsClick() {
		// Placeholder for settings functionality
		console.log('Settings button clicked in ButtonPanel');
		appActions.openSettings(); // Call appActions to open the main settings dialog
	}

	let buttonActionListener: (event: CustomEvent) => void;

	onMount(() => {
		// Listen for button actions
		buttonActionListener = (event: CustomEvent) => {
			if (event.detail && event.detail.id) {
				handleButtonActionWrapper(event);
			}
		};
		document.addEventListener('action', buttonActionListener as EventListener);
	});

	onDestroy(() => {
		if (buttonActionListener) {
			document.removeEventListener('action', buttonActionListener as EventListener);
		}
	});
</script>

<div class="button-panel" style="--button-size-factor: {buttonSizeFactor};">
	<SettingsButton on:click={handleSettingsClick} />
	<ClearSequenceButton on:clearSequence={handleClearSequence} />
	<button onclick={handleRemoveBeat}>Remove Beat</button>
	<SequenceOverlayButton />
	<ShareButton {beatFrameElement} />
</div>

<style>
	.button-panel {
		position: relative;
		width: 100%;
		height: 100%;
		/* The buttons themselves are positioned absolutely within the main-layout */
	}

	/* Add styles for the SettingsButton to position it top-left */
	:global(.button-panel > .settings-button) {
		position: absolute;
		top: calc(var(--button-size-factor, 1) * 10px); /* Consistent with other buttons */
		left: calc(var(--button-size-factor, 1) * 10px);
		width: calc(var(--button-size-factor, 1) * 45px); /* Base size from ShareButton */
		height: calc(var(--button-size-factor, 1) * 45px);
		z-index: 40; /* Consistent with other FABs */
		/* Override default margin from SettingsButton's own style if necessary */
		margin: 0 !important;
	}

	/* Ensure the icon inside scales correctly if its internal styling doesn't use a factor */
	:global(.button-panel > .settings-button .settings-icon) {
		font-size: calc(var(--button-size-factor, 1) * 19px); /* Base icon size from ShareButton */
	}
</style>
