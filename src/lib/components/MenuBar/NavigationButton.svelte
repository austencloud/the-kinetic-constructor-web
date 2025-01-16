<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let isMobile: boolean;   
	export let isActive: boolean = false;
	export let onClick: () => void;

	let fontSize: number;
	let buttonWidth: number;
	let buttonHeight: number;

	function updateButtonStyles() {
		if (typeof window === 'undefined') return;

		const w = window.innerWidth;
		const h = window.innerHeight;

		if (isMobile) {
			// On mobile => circle
			buttonWidth = Math.max(50, w / 16);
			buttonHeight = buttonWidth;
			fontSize = buttonWidth * 0.5;
		} else {
			// Desktop => rectangle
			buttonWidth = Math.max(120, w / 8);
			buttonHeight = Math.max(40, h / 20);
			fontSize = Math.max(16, w / 70);
		}
	}

	onMount(() => {
		updateButtonStyles();
		window.addEventListener('resize', updateButtonStyles);
	});

	onDestroy(() => {
		window.removeEventListener('resize', updateButtonStyles);
	});
</script>

<button
	on:click={onClick}
	class={isActive ? 'active' : 'inactive'}
	style="
		font-size: {fontSize}px;
		width: {buttonWidth}px;
		height: {buttonHeight}px;
		{isMobile ? 'border-radius: 50%;' : 'border-radius: 10px;'}
	"
>
	<slot />
</button>
