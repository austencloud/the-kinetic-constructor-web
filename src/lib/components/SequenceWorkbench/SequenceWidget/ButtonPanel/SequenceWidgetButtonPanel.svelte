<script lang="ts">
	import { onMount } from 'svelte';
	import SequenceWidgetButton from './SequenceWidgetButton.svelte';

	let panelRef: HTMLDivElement | null = null;
	let buttonSize = 60;

	const iconRoot = '/button_panel_icons/';
	const buttons = [
		{ icon: `${iconRoot}add_to_dictionary.png`, title: 'Add to Dictionary', id: 'addToDictionary' },
		{ icon: `${iconRoot}save_image.png`, title: 'Save Image', id: 'saveImage' },
		{ icon: `${iconRoot}eye.png`, title: 'View Full Screen', id: 'viewFullScreen' },
		{ icon: `${iconRoot}mirror.png`, title: 'Mirror Sequence', id: 'mirrorSequence' },
		{ icon: `${iconRoot}yinyang1.png`, title: 'Swap Colors', id: 'swapColors' },
		{ icon: `${iconRoot}rotate.png`, title: 'Rotate Sequence', id: 'rotateSequence' },
		{ icon: `${iconRoot}delete.png`, title: 'Delete Beat', id: 'deleteBeat' },
		{ icon: `${iconRoot}clear.png`, title: 'Clear Sequence', id: 'clearSequence' }
	];

	// We'll observe the parent container's size changes
	let resizeObserver: ResizeObserver | undefined;

	function updateButtonSize(containerHeight: number) {
		// Example: scale buttonSize to e.g. containerHeight / 6
		// But also clamp so we don't get too big or too tiny
		buttonSize = containerHeight / 14;
	}

	onMount(() => {
		// If you only want a one-time measurement, you could do:
		// updateButtonSize(panelRef?.clientHeight || 0);

		// But to adapt to parent resizing, use a ResizeObserver:
		if (panelRef) {
			resizeObserver = new ResizeObserver(entries => {
				for (const entry of entries) {
					if (entry.contentBoxSize) {
						// contentBoxSize might be an array, so handle the first item
						const cs = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize;
						const containerHeight = cs.blockSize;
						updateButtonSize(containerHeight);
					} else {
						// fallback for older browsers:
						const rect = entry.contentRect;
						updateButtonSize(rect.height);
					}
				}
			});
			resizeObserver.observe(panelRef);
		}

		return () => {
			// Cleanup
			resizeObserver?.disconnect();
		};
	});
</script>

<div class="button-panel" bind:this={panelRef}>
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
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 3%;
		position: relative;
		z-index: 1;

		/* If the container is the entire parent, 
		   ensure it has some defined height or is in a flex layout. */
	}
</style>
