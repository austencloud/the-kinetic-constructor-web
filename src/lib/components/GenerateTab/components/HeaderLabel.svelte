<!-- src/lib/components/GenerateTab/ui/HeaderLabel.svelte -->
<script lang="ts">
	// Props using Svelte 5 runes
	const { text = 'Customize Your Sequence' } = $props<{
		text?: string;
	}>();
</script>

<div class="header-container">
	<h2>{text}</h2>
</div>

<style>
	.header-container {
		text-align: center;
		margin: 0 0 1rem 0;
	}

	h2 {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color-text-primary, #ffffff);
		margin: 0;
		padding: 0;
	}
</style>
