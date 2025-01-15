<script lang="ts">
	export let pictographData: any;
	export let onClick: (() => void) | undefined; // Optional click handler
	export let isSelected: boolean = false; // Highlight if selected
	export let name: string | null = null; // Optional name for display
	export let interactive: boolean = true; // Controls interactivity
</script>

<div
	class="pictograph-wrapper"
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
	<div class="base-pictograph">
		<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
			{#if pictographData?.grid}
				<image
					href={pictographData.grid}
					width="100%"
					height="100%"
					preserveAspectRatio="xMidYMid meet"
					style="cursor: pointer;"
				/>
			{:else}
				<text
					x="50%"
					y="50%"
					text-anchor="middle"
					alignment-baseline="middle"
					font-size="10"
					fill="#000"
				>
					No grid available
				</text>
			{/if}
		</svg>
	</div>
	{#if name}
		<span class="pictograph-label">{name}</span>
	{/if}
</div>

<style>
	.pictograph-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: var(--cursor, default); /* Dynamic cursor */
		transition: transform 0.2s ease;
		color: white;
		transition: transform 0.1s ease-in-out;
	}
	
	.pictograph-wrapper:hover {
		transform: var(--hover-scale, none);
	}
	.pictograph-wrapper:active {
		transform: var(--click-scale, none);
	}
	
	.base-pictograph {
		color: white;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #f0f0f0;
		aspect-ratio: 1 / 1; /* Maintain square aspect ratio */
	}


</style>
