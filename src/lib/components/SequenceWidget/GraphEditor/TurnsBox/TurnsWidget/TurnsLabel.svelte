<script lang="ts">
	export let turns = 0; // Accept turns as a prop
	export let color = 'blue'; // Accept color as a prop

	// Function to format turns
	function formatTurns(turns: number) {
		return Number.isInteger(turns) ? turns : turns.toFixed(1);
	}
</script>

<div class="turns-label" style="--color: {color}">
	{formatTurns(turns)}
</div>

<style>
	.turns-label {
		color: black;
		font-weight: bold;
		font-size: 2.4em;
		width: 10%;
		display: flex;
		justify-content: center;
	}
</style>
