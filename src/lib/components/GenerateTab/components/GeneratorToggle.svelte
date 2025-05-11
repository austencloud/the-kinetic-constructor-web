<script lang="ts" context="module">
	export interface ToggleOption {
		id: string;
		label: string;
		icon?: string;
	}
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let options: ToggleOption[];
	export let value: string; // The current selected option id
	// export let onchange: (newVal: string) => void = () => {}; // Svelte 5 runes make this less common for parent->child updates
	// Parent can directly modify 'value' if it's $state
	// For child->parent, dispatch event

	const dispatch = createEventDispatcher<{ change: string }>();

	function selectOption(id: string) {
		if (id !== value) {
			// Parent will update 'value' prop which is reactive due to $state or $props
			dispatch('change', id);
		}
	}
</script>

<div class="generator-toggle">
	{#each options as option (option.id)}
		<button
			class="toggle-button"
			class:active={option.id === value}
			on:click={() => selectOption(option.id)}
			aria-pressed={option.id === value}
			title={option.label}
		>
			{#if option.icon}
				<span class="icon">{option.icon}</span>
			{/if}
			<span class="label">{option.label}</span>
		</button>
	{/each}
</div>

<style>
	.generator-toggle {
		display: flex;
		background: var(--color-surface-700, rgba(30, 40, 60, 0.5)); /* Default from your theme */
		border-radius: var(--border-radius-md, 0.5rem);
		padding: 0.25rem;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
	}
	.toggle-button {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
		border-radius: calc(var(--border-radius-md, 0.5rem) - 0.25rem);
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 500;
	}
	.toggle-button:hover {
		color: var(--color-text-primary, white);
	}
	.toggle-button.active {
		background: var(--color-accent, #3a7bd5);
		color: var(--color-text-primary, white);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
	.icon {
		font-size: 1rem;
	}
</style>
