<script>
	export let currentWord = 'Word';
	export let width = 100; // Default width value

	$: fontSize = `${width / 40}px`; // Calculate font size based on width
</script>

<div class="current-word-label" style="font-size: {fontSize};">
	{currentWord}
</div>

<style>
	.current-word-label {
		text-align: center;
		font-weight: bold;
	}
</style>
