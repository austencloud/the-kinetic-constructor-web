<!-- src/lib/components/SequenceWorkbench/ButtonPanel/SequenceWidgetButtonPanel.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';

	// Define types
	type LayoutOrientation = 'vertical' | 'horizontal';

	interface ButtonDefinition {
		icon: string;
		title: string;
		id: string;
	}

	// Component props
	export let containerWidth = 0;
	export let containerHeight = 0;
	export let isPortrait = true;

	// Reactive layout orientation based on isPortrait
	$: layout = isPortrait ? 'horizontal' : 'vertical';

	// Button data - could be moved to a store for better organization
	const buttons: ButtonDefinition[] = [
		{
			icon: '/button_panel_icons/add_to_dictionary.png',
			title: 'Add to Dictionary',
			id: 'addToDictionary'
		},
		{
			icon: '/button_panel_icons/save_image.png',
			title: 'Save Image',
			id: 'saveImage'
		},
		{
			icon: '/button_panel_icons/eye.png',
			title: 'View Full Screen',
			id: 'viewFullScreen'
		},
		{
			icon: '/button_panel_icons/mirror.png',
			title: 'Mirror Sequence',
			id: 'mirrorSequence'
		},
		{
			icon: '/button_panel_icons/yinyang1.png',
			title: 'Swap Colors',
			id: 'swapColors'
		},
		{
			icon: '/button_panel_icons/rotate.png',
			title: 'Rotate Sequence',
			id: 'rotateSequence'
		},
		{
			icon: '/button_panel_icons/delete.png',
			title: 'Delete Beat',
			id: 'deleteBeat'
		},
		{
			icon: '/button_panel_icons/clear.png',
			title: 'Clear Sequence',
			id: 'clearSequence'
		}
	];

	// Reactive button size calculation
	$: buttonSize = calculateButtonSize(containerWidth, containerHeight, isPortrait);

	// Dispatch a custom event when a button is clicked
	function dispatchAction(action: string) {
		const event = new CustomEvent('action', {
			detail: { action },
			bubbles: true
		});
		document.dispatchEvent(event);
	}

	// Calculate button size based on container dimensions and orientation
	function calculateButtonSize(width: number, height: number, isPortrait: boolean): number {
		const isMobile = width <= 768;

		if (isMobile) {
			return Math.max(30, Math.min(60, width / 10));
		} else if (isPortrait) {
			return Math.max(30, Math.min(60, width / 10));
		} else {
			return Math.max(30, Math.min(60, height / 14));
		}
	}
</script>

<div
	class="button-panel"
	class:vertical={layout === 'vertical'}
	class:horizontal={layout === 'horizontal'}
>
	{#each buttons as button (button.id)}
		<button
			class="sequence-button"
			style="width: {buttonSize}px; height: {buttonSize}px;"
			on:click={() => dispatchAction(button.id)}
			title={button.title}
		>
			<img src={button.icon} alt={button.title} />
		</button>
	{/each}
</div>

<style>
	.button-panel {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		flex: 1;
		padding: 5px;
	}

	.vertical {
		flex-direction: column;
	}

	.horizontal {
		flex-direction: row;
	}

	.sequence-button {
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		border: 1px solid #ccc;
		cursor: pointer;
		box-sizing: border-box;
		padding: 0;
		transition: all 0.1s ease-out;
		background-color: white;
		aspect-ratio: 1 / 1;
	}

	.sequence-button:hover {
		background-color: #f0f0f0;
		transform: scale(1.1);
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
	}

	.sequence-button:active {
		transform: scale(0.9);
		box-shadow: inset 0px 2px 4px rgba(0, 0, 0, 0.2);
	}

	.sequence-button img {
		width: 70%;
		height: 70%;
		object-fit: contain;
	}
</style>
