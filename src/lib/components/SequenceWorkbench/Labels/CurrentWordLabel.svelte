<script lang="ts">
	import { onMount } from 'svelte';
	export let currentWord = 'Word';
	export let width = 100;

	let wordDisplay: HTMLSpanElement;
	let fontSize = Math.max(width / 40, 30);
	let parentWidth: number;

	function adjustFontSize() {
		if (!wordDisplay || !parentWidth) return;

		fontSize = Math.max(width / 40, 30);
		wordDisplay.style.fontSize = `${fontSize}px`;

		while (wordDisplay.scrollWidth > parentWidth * 0.9 && fontSize > 12) {
			fontSize -= 1;
			wordDisplay.style.fontSize = `${fontSize}px`;
		}
	}

	onMount(() => {
		parentWidth = wordDisplay?.parentElement?.clientWidth ?? 0;
		adjustFontSize();
	});

	$: if (currentWord || width) {
		setTimeout(adjustFontSize, 0);
	}
</script>

<div class="current-word-label">
	<span bind:this={wordDisplay} class="word-display">
		{currentWord}
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
	}

	.word-display {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		max-width: 90%;
		white-space: nowrap;
	}
</style>
