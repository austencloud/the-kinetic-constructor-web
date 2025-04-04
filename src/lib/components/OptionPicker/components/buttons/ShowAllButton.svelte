<!-- src/lib/components/OptionPicker/components/buttons/ShowAllButton.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	
	export let showAllActive: boolean = false;
	export let isMobileDevice: boolean = false;
	export let onToggle: () => void;
</script>

<button
	class="show-all-button"
	class:mobile={isMobileDevice}
	class:centered={showAllActive}
	class:top-left={!showAllActive}
	on:click={onToggle}
	aria-pressed={showAllActive}
	aria-label={showAllActive
		? 'Enable filters and sorting'
		: 'Show all options without filtering'}
	transition:fly={{ y: -10, duration: 300, easing: quintOut }}
>
	{#if showAllActive}
		<span class="icon">👁️</span>
		<span>Filters Off</span>
	{:else}
		<span class="icon">✨</span>
		<span>Show All</span>
	{/if}
</button>

<style>
	.show-all-button {
		position: absolute;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 6px;
		background-color: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 6px 10px;
		font-size: 0.85rem;
		font-weight: 500;
		color: #374151;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		transition:
			top 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55),
			left 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55),
			transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55),
			background-color 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease,
			box-shadow 0.2s ease,
			opacity 0.3s ease;
	}
	
	.show-all-button .icon {
		font-size: 1.1em;
		line-height: 1;
	}

	.show-all-button.top-left {
		top: clamp(5px, 1vw, 10px);
		left: clamp(10px, 2vw, 20px);
		transform: translate(0, 0) scale(1);
		opacity: 1;
	}
	
	.show-all-button.top-left:hover {
		background-color: #f9fafb;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	.show-all-button.centered {
		top: 20px;
		left: 50%;
		transform: translate(-50%, 0) scale(1.05);
		background-color: #e0f2fe;
		border-color: #7dd3fc;
		color: #0c4a6e;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		opacity: 1;
	}
	
	.show-all-button.centered:hover {
		background-color: #bae6fd;
	}

	.show-all-button:active {
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	}
	
	.show-all-button.top-left:active {
		transform: translate(0, 0) scale(0.97);
	}
	
	.show-all-button.centered:active {
		transform: translate(-50%, 0) scale(0.98);
	}

	.show-all-button:focus-visible {
		outline: 2px solid #4299e1;
		outline-offset: 1px;
	}
	
	@media (max-width: 480px) {
		.show-all-button {
			padding: 5px 8px;
			font-size: 0.8rem;
			gap: 4px;
		}
		
		.show-all-button.centered {
			top: 15px;
		}
	}
</style>