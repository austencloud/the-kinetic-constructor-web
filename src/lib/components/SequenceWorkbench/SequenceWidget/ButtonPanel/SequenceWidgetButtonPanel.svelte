<script lang="ts">
	import { onMount } from 'svelte';
	import SequenceWidgetButton from './SequenceWidgetButton.svelte';

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
		{ icon: `${iconRoot}clear.png`, title: 'Clear Sequence' }
	];

	const updateButtonSize = () => {
		const containerHeight = window.innerHeight;
		buttonSize = Math.max(40, Math.min(80, containerHeight / 20));
	};

	onMount(() => {
		updateButtonSize();
		window.addEventListener('resize', updateButtonSize);
		return () => window.removeEventListener('resize', updateButtonSize);
	});
</script>

<div class="button-panel">
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
	}
</style>
