<script lang="ts">
	import { useResponsiveLayout } from '$lib/composables/useResponsiveLayout';
	import { onMount, onDestroy } from 'svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver';

	import { handleButtonAction } from './ButtonPanel/ButtonPanelLogic';
	import {
		calculateWorkbenchIsPortrait,
		calculateButtonSizeFactor
	} from './utils/SequenceLayoutCalculator';
	import { useSequenceMetadata } from './utils/SequenceMetadataManager';
	import { openSequenceOverlay } from '$lib/state/sequenceOverlay/sequenceOverlayState';

	import type { ActionEventDetail } from './ButtonPanel/types';
	import { appActions } from '$lib/state/machines/app/app.actions';
	import * as sequenceActions from '$lib/state/machines/sequenceMachine/actions';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';

	import SequenceContent from './content/SequenceContent.svelte';
	import SequenceOverlay from './components/SequenceOverlay.svelte';
	import SequenceOverlayContent from './overlay/SequenceOverlayContent.svelte';
	import ClearSequenceButton from './ClearSequenceButton.svelte';
	import RemoveBeatButton from './RemoveBeatButton.svelte';
	import SequenceOverlayButton from './SequenceOverlayButton.svelte';
	import ShareButton from './ShareButton.svelte';
	import SettingsButton from '$lib/components/MenuBar/SettingsButton/SettingsButton.svelte';

	const { size, resizeObserver } = useResizeObserver();
	const { dimensions } = useResponsiveLayout();

	let activeMode = $state<'construct' | 'generate'>('construct');
	let beatFrameElement = $state<HTMLElement | null>(null);

	// Emit the full sequence widget dimensions whenever they change
	$effect(() => {
		if ($size && $size.width > 0 && $size.height > 0) {
			const event = new CustomEvent('sequence-widget-dimensions', {
				bubbles: true,
				detail: {
					width: $size.width,
					height: $size.height
				}
			});
			document.dispatchEvent(event);
		}
	});

	const workbenchIsPortrait = $derived(
		calculateWorkbenchIsPortrait($dimensions.width, $size.height)
	);

	const buttonSizeFactor = $derived(
		calculateButtonSizeFactor($dimensions.width, $dimensions.height)
	);

	let sequenceName = $state('');

	$effect(() => {
		const { unsubscribe } = useSequenceMetadata((metadata) => {
			sequenceName = metadata.name;
		});
		return unsubscribe;
	});

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

	// Remove selected beat and following beats
	function handleRemoveBeat() {
		const selectedBeatIds = sequenceContainer.state.selectedBeatIds;
		if (selectedBeatIds.length > 0) {
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
		appActions.openSettings();
	}

	let buttonActionListener: (event: CustomEvent) => void;

	onMount(() => {
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

{#key null}
	<div class="sequence-widget" use:resizeObserver>
		<div
			class="main-layout"
			class:portrait={workbenchIsPortrait}
			style="--container-width: {$dimensions.width}px;
			   --container-height: {$dimensions.height}px;
			   --button-size-factor: {buttonSizeFactor};"
		>
			<div class="left-vbox">
				<SequenceContent
					containerHeight={$size.height}
					containerWidth={$dimensions.width}
					{beatFrameElement}
				/>
			</div>

			<SettingsButton on:click={handleSettingsClick} />
			<ClearSequenceButton on:clearSequence={handleClearSequence} />
			<RemoveBeatButton on:removeBeat={handleRemoveBeat} />
			<SequenceOverlayButton />
			<ShareButton {beatFrameElement} />
		</div>

		<SequenceOverlay title={sequenceName}>
			<SequenceOverlayContent title={sequenceName} />
		</SequenceOverlay>
	</div>
{/key}

<style>
	.sequence-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
		flex: 1;
	}

	.main-layout {
		display: flex;
		flex-direction: row;
		height: 100%;
		width: 100%;
		overflow: hidden;
		justify-content: space-between;
		position: relative;
	}

	.main-layout.portrait {
		flex-direction: column;
		justify-content: flex-start;
	}

	.left-vbox {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		min-height: 0;
		flex: 1;
		overflow: hidden;
		transition: all 0.3s ease-out;
	}

	.main-layout {
		transition: flex-direction 0.3s ease-out;
	}
</style>
