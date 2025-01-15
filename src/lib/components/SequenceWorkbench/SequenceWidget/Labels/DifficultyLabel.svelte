<script>
	export let difficultyLevel = 1;

	$: difficultyText = `Level ${difficultyLevel}`;
</script>

<div class="difficulty-label">
	{difficultyText}
</div>

<style>
	.difficulty-label {
		text-align: center;
		font-size: 1.2rem;
		font-weight: bold;
	}
</style>
