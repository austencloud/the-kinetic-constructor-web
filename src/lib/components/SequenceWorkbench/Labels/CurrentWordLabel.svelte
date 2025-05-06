<script>
	export let currentWord = 'Word';
	export let width = 100;

	// Calculate font size based on width with a minimum value
	$: fontSize = `${Math.max(width / 40, 30)}px`;
</script>

<div class="current-word-label" style="font-size: {fontSize};">
	<span class="word-display">
		{currentWord}
	</span>
</div>

<style>
	.current-word-label {
		text-align: center;
		font-weight: bold;
		position: relative;
		padding: 2px 5px;
	}

	.word-display {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
	}
</style>
