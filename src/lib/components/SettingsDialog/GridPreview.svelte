<script lang="ts">
	export let grid: number[][];
	export let numBeats: number;
</script>

<div class="grid">
	{#each grid as row}
		<div class="grid-row">
			{#each row as beat (beat)}
				{#if beat <= numBeats}
					<div class="grid-cell">{beat}</div>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style>
	.grid {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.grid-row {
		display: flex;
		gap: 5px;
	}
	.grid-cell {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 0.8rem;
		font-weight: bold;
	}
</style>
