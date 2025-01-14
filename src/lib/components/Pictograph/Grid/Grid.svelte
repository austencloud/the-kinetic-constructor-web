<script lang="ts">
	export let grid: any;
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 650" class="grid">
	{#each grid.points as { x, y }}
		<circle cx={x} cy={y} r="5" fill="black" />
	{/each}
</svg>

<style>
	.grid {
		width: 100%;
		height: 100%;
	}
</style>
