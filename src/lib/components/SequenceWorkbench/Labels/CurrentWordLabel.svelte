<script lang="ts">
	import { onMount } from 'svelte';

	const { currentWord = 'Word', width = 100 } = $props();

	let wordDisplay: HTMLSpanElement;
	let fontSize = Math.max(width / 40, 30);
	let parentWidth: number;

	const MAX_CHARS = 16;

	// Truncate words longer than MAX_CHARS
	const displayWord = $derived(
		currentWord.length > MAX_CHARS ? currentWord.substring(0, MAX_CHARS) + '...' : currentWord
	);

	function adjustFontSize() {
		if (!wordDisplay || !parentWidth) return;

		// Start with a reasonable size based on container width
		fontSize = Math.max(width / 40, 30);
		wordDisplay.style.fontSize = `${fontSize}px`;

		// Account for the space between header buttons
		// Use a more conservative width target (80%) to ensure text fits between buttons
		const targetWidth = parentWidth * 0.8;

		while (wordDisplay.scrollWidth > targetWidth && fontSize > 12) {
			fontSize -= 1;
			wordDisplay.style.fontSize = `${fontSize}px`;
		}
	}

	onMount(() => {
		// Get parent element width for sizing calculations
		parentWidth = wordDisplay?.parentElement?.clientWidth ?? 0;
		// Initial size adjustment
		setTimeout(adjustFontSize, 0);
	});

	// Respond to changes in word or container width
	$effect(() => {
		if (currentWord || width) {
			setTimeout(adjustFontSize, 0);
		}
	});
</script>

<div class="current-word-label">
	<span bind:this={wordDisplay} class="word-display">
		{displayWord}
	</span>
</div>

<style>
	.current-word-label {
		text-align: center;
		font-weight: bold;
		position: relative;
		/* Add horizontal padding that respects safe area insets */
		padding: 2px calc(5px + var(--safe-inset-right, 0px)) 2px
			calc(5px + var(--safe-inset-left, 0px));
		width: 100%;
		box-sizing: border-box;
		/* Ensure label is properly centered between buttons */
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.word-display {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		max-width: 90%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
