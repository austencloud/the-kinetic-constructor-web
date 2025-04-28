<script lang="ts">
	// In a real app, we would import a real Pictograph component
	import Pictograph from '../shared/Pictograph.svelte';

	export let pictograph: any = null;
</script>

<div class="pictograph-question">
	{#if pictograph}
		<Pictograph data={pictograph} size="large" />
	{:else}
		<div class="placeholder">No pictograph data</div>
	{/if}
</div>

<style>
	.pictograph-question {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.placeholder {
		border: 2px dashed #555;
		border-radius: 8px;
		padding: 2rem;
		color: #777;
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>
