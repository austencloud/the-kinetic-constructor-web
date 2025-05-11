<script lang="ts" generics="T extends { id: string; label: string; description: string }">
	import { createEventDispatcher } from 'svelte';

	export let capTypes: T[];
	export let selectedCapId: string;

	const dispatch = createEventDispatcher<{ select: string }>();

	function handleSelect(capId: string) {
		dispatch('select', capId);
	}

	// Grouping logic from your existing component (optional, but can improve organization)
	$: groupedCapTypes = {
		mirror: capTypes.filter(cap => cap.id.toLowerCase().includes('mirrored')),
		rotate: capTypes.filter(cap => cap.id.toLowerCase().includes('rotated')),
		other: capTypes.filter(cap => !cap.id.toLowerCase().includes('mirrored') && !cap.id.toLowerCase().includes('rotated')),
	};
</script>

<div class="cap-picker">
	{#each Object.entries(groupedCapTypes) as [groupName, typesInGroup]}
		{#if typesInGroup.length > 0}
			<div class="cap-group">
				<h5 class="group-title">{groupName.charAt(0).toUpperCase() + groupName.slice(1)} Types</h5>
				<div class="cap-buttons-list">
					{#each typesInGroup as capType (capType.id)}
						<button
							class="cap-button"
							class:selected={selectedCapId === capType.id}
							on:click={() => handleSelect(capType.id)}
							title={capType.description}
							aria-pressed={selectedCapId === capType.id}
						>
							<span class="cap-label">{capType.label}</span>
							{#if selectedCapId === capType.id}
								<span class="selected-indicator" aria-hidden="true">✓</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.cap-picker {
		display: flex;
		flex-direction: column;
		gap: 1rem; /* Increased gap between groups */
	}
	.cap-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.group-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
		margin: 0;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.1));
		text-transform: capitalize;
	}
	.cap-buttons-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem; /* Slightly reduced gap between buttons */
	}
	.cap-button {
		background: var(--color-surface-800, rgba(20,30,50,0.6)); /* Darker than parent for contrast */
		border: 1px solid var(--color-border, rgba(255,255,255,0.1));
		color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
		border-radius: calc(var(--border-radius-md, 0.5rem) - 0.125rem);
		padding: 0.6rem 0.75rem; /* Adjusted padding */
		width: 100%;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.875rem;
	}
	.cap-button:hover {
		background: var(--color-surface-hover, rgba(255,255,255,0.1));
		border-color: var(--color-accent, #3a7bd5);
        color: var(--color-text-primary, white);
	}
	.cap-button.selected {
		background: var(--color-accent, #3a7bd5);
		color: white;
		border-color: var(--color-accent, #3a7bd5);
		font-weight: 500;
	}
	.cap-label {
		flex-grow: 1;
	}
	.selected-indicator {
		font-size: 0.8rem;
		margin-left: 0.5rem;
	}
</style>
