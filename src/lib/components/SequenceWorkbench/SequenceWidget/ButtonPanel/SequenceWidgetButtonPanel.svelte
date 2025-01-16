<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import SequenceWidgetButton from './SequenceWidgetButton.svelte';

	export let sequenceWorkbenchHeight: number;

	let panelRef: HTMLDivElement | null = null;

	// Initial button size
	let buttonSize = 60;
	let height = 0;
	// Dynamic gap state
	let panelGap = 8; // some default (px or so)

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

	let resizeObserver: ResizeObserver | undefined;

	function updateGap(containerHeight: number) {
		// For example: let the gap be 1/10 of container height
		panelGap = Math.floor(containerHeight / 30);

		// If you want a minimum/maximum clamp:
		// panelGap = Math.max(5, Math.min(20, containerHeight / 10));
	}

	function updateButtonSize() {
		// Calculate button size based on sequenceWorkbenchHeight
		buttonSize = Math.floor(sequenceWorkbenchHeight / 18); // Example calculation
	}

	onMount(() => {
		if (panelRef) {
			resizeObserver = new ResizeObserver(entries => {
				for (const entry of entries) {
					let containerHeight = 0;
					if (entry.contentBoxSize) {
						const cs = Array.isArray(entry.contentBoxSize)
							? entry.contentBoxSize[0]
							: entry.contentBoxSize;
						containerHeight = cs.blockSize;
					} else {
						const rect = entry.contentRect;
						containerHeight = rect.height;
					}
					updateGap(containerHeight);
				}
			});
			resizeObserver.observe(panelRef);
		}
		return () => {
			resizeObserver?.disconnect();
		};
	});

	afterUpdate(() => {
		updateButtonSize();
	});
</script>

<div class="button-panel" bind:this={panelRef} style="--panel-gap: {panelGap}px;">
	{#each buttons as button}
		<SequenceWidgetButton
			icon={button.icon}
			title={button.title}
			buttonSize={buttonSize}
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
		/* Instead of gap: 3%, we do a dynamic gap from CSS var */
		gap: var(--panel-gap, 8px);
		position: relative;
		z-index: 1;
		/* ensure some height if needed */
		min-height: 0;
	}
</style>
