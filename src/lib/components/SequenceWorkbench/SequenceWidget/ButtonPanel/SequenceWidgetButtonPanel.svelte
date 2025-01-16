<script lang="ts">
	import SequenceWidgetButton from './SequenceWidgetButton.svelte';
	import { onMount, onDestroy } from 'svelte';

	export let layout: 'vertical' | 'horizontal' = 'vertical';
	export let containerWidth: number = 0;
	export let containerHeight: number = 0;
	export let isPortrait: boolean = true;

	let buttonSize = 60; // Default size
	let panelRef: HTMLElement | null = null;
	let isMobile: boolean = false;

	// Update button size dynamically
	function updateButtonSize() {
		if (isMobile) {
			// Smaller sizes for mobile
			buttonSize = Math.max(20, containerWidth / 12); // Reduce size slightly for mobile
		} else if (isPortrait) {
			buttonSize = Math.max(25, containerWidth / 10); // Horizontal layout
		} else {
			buttonSize = Math.max(25, containerHeight / 14); // Vertical layout
		}
	}

	function updateIsMobile() {
		isMobile = window.innerWidth <= 768; // Example threshold for mobile
	}
	// ResizeObserver to dynamically track container size
	let resizeObserver: ResizeObserver | undefined;
	onMount(() => {
		if (panelRef) {
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					if (entry.contentBoxSize) {
						const size = Array.isArray(entry.contentBoxSize)
							? entry.contentBoxSize[0]
							: entry.contentBoxSize;
						containerWidth = size.inlineSize;
						containerHeight = size.blockSize;
					} else {
						containerWidth = entry.contentRect.width;
						containerHeight = entry.contentRect.height;
					}
					updateButtonSize(); // Update button size immediately
				}
			});
			resizeObserver.observe(panelRef);
		}
		updateIsMobile();
		window.addEventListener('resize', updateIsMobile);

		return () => {
			window.removeEventListener('resize', updateIsMobile);
		};
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
	});

	$: layout = isPortrait ? 'horizontal' : 'vertical';
	$: updateButtonSize();

	const buttons = [
		{
			icon: '/button_panel_icons/add_to_dictionary.png',
			title: 'Add to Dictionary',
			id: 'addToDictionary'
		},
		{ icon: '/button_panel_icons/save_image.png', title: 'Save Image', id: 'saveImage' },
		{ icon: '/button_panel_icons/eye.png', title: 'View Full Screen', id: 'viewFullScreen' },
		{ icon: '/button_panel_icons/mirror.png', title: 'Mirror Sequence', id: 'mirrorSequence' },
		{ icon: '/button_panel_icons/yinyang1.png', title: 'Swap Colors', id: 'swapColors' },
		{ icon: '/button_panel_icons/rotate.png', title: 'Rotate Sequence', id: 'rotateSequence' },
		{ icon: '/button_panel_icons/delete.png', title: 'Delete Beat', id: 'deleteBeat' },
		{ icon: '/button_panel_icons/clear.png', title: 'Clear Sequence', id: 'clearSequence' }
	];
</script>

<div class="button-panel {layout}" bind:this={panelRef}>
	{#each buttons as button}
		<SequenceWidgetButton
			icon={button.icon}
			title={button.title}
			{buttonSize}
			onClick={() => console.log(`${button.title} clicked`)}
		/>
	{/each}
</div>

<style>
	.button-panel {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		width: 100%;
		flex: 1;
	}

	.button-panel.vertical {
		flex-direction: column;
	}

	.button-panel.horizontal {
		flex-direction: row;
	}
</style>
