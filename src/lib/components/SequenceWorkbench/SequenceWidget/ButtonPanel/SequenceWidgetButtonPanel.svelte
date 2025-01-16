<script lang="ts">
	export let layout: 'vertical' | 'horizontal' = 'vertical';
	export let containerWidth: number = 0;
	export let containerHeight: number = 0;
	export let isPortrait: boolean = true;

	let buttonSize = 0;

	// Update button size dynamically
	function updateButtonSize() {
		if (isPortrait) {
			buttonSize = Math.max(20, containerWidth / 12); // Horizontal layout
		} else {
			buttonSize = Math.max(20, containerHeight / 14); // Vertical layout
		}
	}

	// Reactive declarations to ensure `updateButtonSize` is recalculated
	$: layout = isPortrait ? 'horizontal' : 'vertical';
	$: updateButtonSize();

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
</script>

<div class="button-panel {layout}">
	{#each buttons as button}
		<button
			class="button"
			style="width: {buttonSize}px; height: {buttonSize}px;"
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
		width: 100%;
	}

	.button-panel.vertical {
		flex-direction: column;
	}

	.button-panel.horizontal {
		flex-direction: row;
	}

	.button {
		border-radius: 50%;
		border: 1px solid #ccc;
		cursor: pointer;
		aspect-ratio: 1 / 1; /* Always maintain circular shape */
		transition: transform 0.2s;
	}

	.button img {
		width: 70%;
		height: 70%;
		object-fit: contain;
	}

	.button:hover {
		transform: scale(1.1);
	}

	.button:active {
		transform: scale(0.9);
	}
</style>
