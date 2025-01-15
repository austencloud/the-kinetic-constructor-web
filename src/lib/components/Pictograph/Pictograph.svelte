<script lang="ts">
	export let pictographData: any;
	export let onClick: (() => void) | undefined; // Click handler for selection
	export let isSelected: boolean = false; // Highlight if selected
	export let name: string | null = null; // Optional name for display
</script>

<div
	class="pictograph-wrapper"
	class:selected={isSelected}
	on:click={onClick}
	on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick && onClick()}
	tabindex="0"
	role="button"
	aria-pressed={isSelected}
>
	<div class="base-pictograph">
		<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
			{#if pictographData.grid}
				<image
					href={pictographData.grid}
					width="100%"
					height="100%"
					preserveAspectRatio="xMidYMid meet"
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
		cursor: pointer;
		border: 1px solid #ccc;
		border-radius: 5px;
		transition: transform 0.2s ease;
		background-color: white;
		box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
		aspect-ratio: 1 / 1; /* Maintain square aspect ratio */
	}

	.pictograph-wrapper:hover {
		transform: scale(1.05);
	}

	.pictograph-wrapper:active {
		transform: scale(0.95);
	}

	.base-pictograph {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #f0f0f0;
		border-radius: 5px;
	}

	.pictograph-label {
		margin-top: 0.5em;
		text-align: center;
		font-size: 0.9rem;
		color: #333;
	}
</style>
