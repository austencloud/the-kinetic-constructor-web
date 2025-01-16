<script>
	export let type = 'Pro'; // Default motion type
	export let width = 100; // Default width

	// Calculate font size based on width with a minimum value of 20px
	$: fontSize = Math.max(width / 12, 20) + 'px';
</script>

<div class="motion-type-label" style="font-size: {fontSize};">
	{type}
</div>

<style>
	.motion-type-label {
		font-style: italic;
		text-align: center;
		color: black;
	}
</style>
