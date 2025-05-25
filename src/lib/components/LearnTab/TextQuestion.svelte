<script lang="ts">
	// Props using Svelte 5 runes
	const { text = '' } = $props<{
		text?: string;
	}>();
</script>

<div class="text-question">
	<span class="question-text">{text}</span>
</div>

<style>
	.text-question {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.question-text {
		font-size: 4rem;
		font-weight: bold;
		padding: 1rem;
	}
</style>
