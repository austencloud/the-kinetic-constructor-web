<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	// Props
	export let isOpen: boolean = false;
	export let title: string | null = null;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	// Handle close button click
	function handleClose() {
		dispatch('close');
	}

	// Handle escape key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			handleClose();
		}
	}

	// Handle backdrop click (close if clicking outside the content)
	function handleBackdropClick(event: MouseEvent) {
		// Only close if clicking directly on the backdrop, not on its children
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div
		class="fullscreen-overlay"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'fullscreen-title' : undefined}
		tabindex="-1"
		transition:fade={{ duration: 200 }}
	>
		<div class="fullscreen-content" transition:scale={{ duration: 200, start: 0.95 }}>
			{#if title}
				<div class="fullscreen-header">
					<h2 id="fullscreen-title">{title}</h2>
				</div>
			{/if}

			<button
				class="close-button"
				on:click={handleClose}
				aria-label="Close fullscreen view"
				title="Close fullscreen view"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="30"
					height="30"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>

			<div class="fullscreen-body">
				<slot />
			</div>
		</div>
	</div>
{/if}

<style>
	.fullscreen-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.9);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 9999; /* Ensure it's above everything else */
		backdrop-filter: blur(3px);
		padding: 1rem;
		box-sizing: border-box;
	}

	.fullscreen-content {
		position: relative;
		width: 100%;
		height: 100%;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.5);
		border-radius: 8px;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
	}

	.fullscreen-header {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.5rem 1rem;
	}

	.fullscreen-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: #e0e0e0;
		font-weight: 600;
	}

	.fullscreen-body {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}

	.close-button {
		position: absolute;
		top: 15px;
		right: 15px;
		background-color: rgba(255, 255, 255, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.5);
		border-radius: 50%;
		width: 50px;
		height: 50px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		color: white;
		z-index: 1001;
		transition:
			background-color 0.2s,
			transform 0.2s,
			box-shadow 0.2s;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
	}

	.close-button:hover {
		background-color: rgba(255, 255, 255, 0.5);
		transform: scale(1.1);
		box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
	}

	.close-button:active {
		transform: scale(0.95);
		background-color: rgba(255, 255, 255, 0.4);
	}
</style>
