<!-- src/lib/components/SequenceWorkbench/ButtonPanel/SequenceWidgetButtonPanel.svelte -->
<script lang="ts">
	import SequenceWidgetButton from './SequenceWidgetButton.svelte';
	import { onMount } from 'svelte';

	// Define types for panel props
	type LayoutOrientation = 'vertical' | 'horizontal';

	export let layout: LayoutOrientation = 'vertical';
	export let containerWidth = 0;
	export let containerHeight = 0;
	export let isPortrait = true;

	// Define button data with type
	interface ButtonDefinition {
		icon: string;
		title: string;
		id: string;
		action?: () => void;
	}

	// The buttons data - could be moved to a store for better organization
	const buttons: ButtonDefinition[] = [
		{
			icon: '/button_panel_icons/add_to_dictionary.png',
			title: 'Add to Dictionary',
			id: 'addToDictionary',
			action: () => dispatchAction('addToDictionary')
		},
		{
			icon: '/button_panel_icons/save_image.png',
			title: 'Save Image',
			id: 'saveImage',
			action: () => dispatchAction('saveImage')
		},
		{
			icon: '/button_panel_icons/eye.png',
			title: 'View Full Screen',
			id: 'viewFullScreen',
			action: () => dispatchAction('viewFullScreen')
		},
		{
			icon: '/button_panel_icons/mirror.png',
			title: 'Mirror Sequence',
			id: 'mirrorSequence',
			action: () => dispatchAction('mirrorSequence')
		},
		{
			icon: '/button_panel_icons/yinyang1.png',
			title: 'Swap Colors',
			id: 'swapColors',
			action: () => dispatchAction('swapColors')
		},
		{
			icon: '/button_panel_icons/rotate.png',
			title: 'Rotate Sequence',
			id: 'rotateSequence',
			action: () => dispatchAction('rotateSequence')
		},
		{
			icon: '/button_panel_icons/delete.png',
			title: 'Delete Beat',
			id: 'deleteBeat',
			action: () => dispatchAction('deleteBeat')
		},
		{
			icon: '/button_panel_icons/clear.png',
			title: 'Clear Sequence',
			id: 'clearSequence',
			action: () => dispatchAction('clearSequence')
		}
	];

	// Create a custom event dispatcher
	function dispatchAction(action: string) {
		const event = new CustomEvent('action', {
			detail: { action },
			bubbles: true
		});
		document.dispatchEvent(event);
	}

	// Reactive button size calculation
	$: buttonSize = calculateButtonSize(containerWidth, containerHeight, isPortrait);

	// Reactive layout update
	$: layout = isPortrait ? 'horizontal' : 'vertical';

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
		<SequenceWidgetButton
			icon={button.icon}
			title={button.title}
			{buttonSize}
			onClick={button.action || (() => {})}
		/>
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
</style>
