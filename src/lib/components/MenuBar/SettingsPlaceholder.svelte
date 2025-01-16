<!-- SettingsPlaceholder.svelte -->
<script lang="ts">
	import { onMount } from "svelte";

	// You can pass the same "buttonSize" logic or replicate it inline.
	export let buttonSize = 50;
	export let iconSize = 38;
	onMount(() => {
		const updateSizes = () => {
			const newSize = Math.max(30, window.innerWidth / 24);
			buttonSize = newSize;
			iconSize = newSize * 0.75;
		};

		updateSizes();
		window.addEventListener('resize', updateSizes);

		return () => window.removeEventListener('resize', updateSizes);
	});
</script>

<div class="menu-bar-placeholder" style="--button-size: {buttonSize}px;">
	<!-- Placeholder without an icon -->
</div>

<style>
	/* Same styles as SettingsButton, but no hover/active states needed. */
	.menu-bar-placeholder {
		width: var(--button-size);
		height: var(--button-size);
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		border-radius: 50%;
		margin: 5px;
		background-color: transparent; /* Optional: Add a background color to make the placeholder visible */
	}
</style>
