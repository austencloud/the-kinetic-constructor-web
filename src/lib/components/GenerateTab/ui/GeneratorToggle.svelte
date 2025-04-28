<!-- src/lib/components/GenerateTab/ui/GeneratorToggle.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let options: Array<{ id: string; label: string }>;
	export let value: string;

	// Create event dispatcher
	const dispatch = createEventDispatcher<{
		change: string;
	}>();

	// Handle option click
	function handleSelect(id: string) {
		if (id !== value) {
			dispatch('change', id);
		}
	}
</script>

<div class="toggle-container">
	<div class="toggle-track">
		{#each options as option}
			<button
				class="toggle-option"
				class:selected={option.id === value}
				on:click={() => handleSelect(option.id)}
				aria-pressed={option.id === value}
			>
				<span class="option-label">{option.label}</span>
				{#if option.id === 'circular'}
					<span class="option-icon circular-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10"></circle>
							<path d="M12 8L12 12 16 14"></path>
						</svg>
					</span>
				{:else}
					<span class="option-icon freeform-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
							<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
						</svg>
					</span>
				{/if}
			</button>
		{/each}
		<div
			class="toggle-indicator"
			style="transform: translateX({value === options[0].id ? '0%' : '100%'})"
		></div>
	</div>
</div>

<style>
	.toggle-container {
		display: flex;
		justify-content: center;
		padding: 0.25rem;
		width: fit-content;
	}

	.toggle-track {
		position: relative;
		display: flex;
		background: var(--color-surface-800, rgba(20, 30, 50, 0.5));
		border-radius: 0.75rem;
		padding: 0.25rem;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(255, 255, 255, 0.05);
		width: fit-content;
	}

	.toggle-option {
		position: relative;
		z-index: 2;
		background: none;
		border: none;
		color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
		padding: 0.5rem 1.25rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle-option:hover:not(.selected) {
		color: var(--color-text-primary, white);
	}

	.toggle-option.selected {
		color: var(--color-text-primary, white);
	}

	.toggle-indicator {
		position: absolute;
		z-index: 1;
		top: 0.25rem;
		left: 0.25rem;
		width: calc(50% - 0.25rem);
		height: calc(100% - 0.5rem);
		background: var(--color-surface-600, rgba(40, 50, 70, 0.7));
		border-radius: 0.5rem;
		transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.option-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.8;
		transition: opacity 0.2s ease;
	}

	.toggle-option.selected .option-icon {
		opacity: 1;
	}

	.option-label {
		font-weight: 500;
		transition: font-weight 0.2s ease;
	}

	.toggle-option.selected .option-label {
		font-weight: 600;
	}

	/* Add a subtle animation when switching */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(2px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.toggle-option.selected {
		animation: fadeIn 0.3s ease-out forwards;
	}
</style>
