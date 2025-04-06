<!-- src/lib/components/OptionPicker/components/buttons/ShowAllButton.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let showAllActive: boolean = false;
	export let isMobileDevice: boolean = false;
	export let onToggle: () => void;

	$: buttonText = showAllActive ? 'Filters Off' : 'Show All';
	$: buttonIcon = showAllActive ? '👁️' : '✨';
	$: ariaLabelText = showAllActive
		? 'Enable filters and sorting'
		: 'Show all options without filtering';
</script>

<button
	class="show-all-button"
	class:mobile={isMobileDevice}
	class:active={showAllActive}
	on:click={onToggle}
	aria-pressed={showAllActive}
	aria-label={ariaLabelText}
	transition:fly={{ y: -10, duration: 300, easing: quintOut }}
>
	<span class="icon" aria-hidden="true">{buttonIcon}</span>
	<span class="text">{buttonText}</span>
</button>

<style>
	.show-all-button {
		display: flex;
		align-items: center;
		gap: clamp(4px, 1vw, 6px);
		background-color: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: clamp(5px, 1.2vw, 8px) clamp(8px, 1.8vw, 12px);
		font-size: clamp(0.75rem, 2vw, 0.9rem);
		font-weight: 500;
		color: #374151;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease,
			box-shadow 0.2s ease,
			transform 0.1s ease;
		white-space: nowrap;
	}

	.show-all-button .icon {
		font-size: 1.2em;
		line-height: 1;
	}

	.show-all-button:hover {
		background-color: #f9fafb;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	.show-all-button.active {
		background-color: #e0f2fe;
		border-color: #7dd3fc;
		color: #0c4a6e;
	}

	.show-all-button.active:hover {
		background-color: #bae6fd;
	}

	.show-all-button:active {
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
		transform: scale(0.98);
	}

	.show-all-button:focus-visible {
		outline: 2px solid #4299e1;
		outline-offset: 1px;
	}
</style>
