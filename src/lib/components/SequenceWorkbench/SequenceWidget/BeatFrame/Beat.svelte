<script lang="ts">
	export let beat;

	const handleClick = () => {
		console.log(`Beat ${beat.id} clicked`);
	};
</script>

<button type="button" class="beat" class:filled={beat.filled} on:click={handleClick}>
	{beat.id}
</button>

<style>
	.beat {
		display: flex;
		justify-content: center;
		align-items: center;
		border: 2px solid #ccc;
		border-radius: 5px;
		background-color: white;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.beat.filled {
		background-color: #6a79d1;
		color: white;
		font-weight: bold;
	}

	.beat:hover {
		background-color: #9aaed6;
	}
</style>
