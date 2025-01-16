<script>
	export let difficultyLevel = 1;
	export let width = 100; // Default width

	$: difficultyText = `Level ${difficultyLevel}`;
	$: fontSize = `${width / 40}px`; // Calculate font size based on width
</script>

<div class="difficulty-label" style="font-size: {fontSize};">
	{difficultyText}
</div>

<style>
	.difficulty-label {
		text-align: center;
		font-style: italic;
	}
</style>
