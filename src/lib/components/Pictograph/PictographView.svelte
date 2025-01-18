<script lang="ts">
	export let isSelected: boolean = false;
	export let interactive: boolean = true;
	export let onClick: (() => void) | undefined;
	export let name: string | null = null;

</script>

<div
	class="pictograph-view"
	class:selected={isSelected}
	style="--cursor: {interactive ? 'pointer' : 'default'}; --hover-scale: {interactive
		? 'scale(1.05)'
		: 'none'};, --click-scale: {interactive ? 'scale(0.95)' : 'none'};"
	on:click={interactive ? onClick : undefined}
	on:keydown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick?.() : undefined}
	role={interactive ? 'button' : undefined}
	{...interactive ? { tabindex: 0 } : {}}
	aria-pressed={isSelected}
>
	<slot />
	{#if name}
		<span class="pictograph-label">{name}</span>
	{/if}
</div>

<style>
	.pictograph-view {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: var(--cursor, default);
		transition: transform 0.2s ease;
	}

	.pictograph-view:hover {
		transform: var(--hover-scale, none);
	}
	.pictograph-view:active {
		transform: var(--click-scale, none);
	}

	.pictograph-label {
		margin-top: 0.5em;
		font-size: 0.8em;
		text-align: center;
	}
</style>
