<script lang="ts">
	import { fade } from 'svelte/transition';

	// Props using Svelte 5 runes
	const {
		text = '', // Default to empty string
		width = 100 // Default width in pixels
	} = $props<{
		text?: string;
		width?: number;
	}>();

	const minFontSize = 18; // Minimum font size in pixels

	// State variables using Svelte 5 runes
	let visible = $state(false);
	let message = $state('');
	let timeoutId = $state<number | null>(null);

	// Derived values using Svelte 5 runes
	const fontSize = $derived(`${Math.max(width / 80, minFontSize)}px`);

	// Watch for changes to the text prop using $effect
	$effect(() => {
		if (text && text !== message) {
			showMessage(text);
		}
	});

	// Function to show a message temporarily
	function showMessage(newMessage: string): void {
		// Clear any existing timeout
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}

		// Update message and make visible
		message = newMessage;
		visible = true;

		// Set timeout to hide after 4 seconds
		timeoutId = window.setTimeout(() => {
			visible = false;
		}, 4000);
	}

	// Clean up on component destroy using Svelte 5 effect cleanup
	$effect(() => {
		return () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}
		};
	});
</script>

{#if visible}
	<div class="indicator-label" style="font-size: {fontSize};" transition:fade={{ duration: 300 }}>
		{message}
	</div>
{:else}
	<div class="indicator-label-placeholder"></div>
{/if}

<style>
	.indicator-label {
		text-align: center;
		font-weight: bold;
		padding: 5px;
		transition: opacity 0.5s ease-out;
	}

	.indicator-label-placeholder {
		height: 30px; /* Maintain consistent height when empty */
	}
</style>
