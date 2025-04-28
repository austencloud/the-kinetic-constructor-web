<!-- src/lib/components/OptionPicker/components/messages/LoadingMessage.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import LoadingSpinner from '$lib/components/MainWidget/loading/LoadingSpinner.svelte';
	import { prefersReducedMotion } from '../../utils/a11y';
</script>

<div
	class="message-container loading transition-optimized"
	transition:fade={{ duration: $prefersReducedMotion ? 0 : 300, easing: cubicOut }}
>
	<div class="pulse-container">
		<LoadingSpinner />
	</div>
	<p>Loading options...</p>
</div>

<style>
	.message-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		padding: 2rem;
		text-align: center;
		color: #6b7280;
		box-sizing: border-box;
		font-size: 1.1rem;
		position: absolute;
		top: 0;
		left: 0;
		background-color: transparent;
		border-radius: 8px;
	}

	.message-container.loading p {
		margin-top: 1rem;
	}

	/* Performance optimizations */
	.transition-optimized {
		will-change: transform, opacity;
		backface-visibility: hidden;
		transform: translateZ(0); /* Hardware acceleration hint */
	}

	/* Pulse animation container */
	.pulse-container {
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0% {
			opacity: 0.6;
			transform: scale(0.95);
		}
		50% {
			opacity: 1;
			transform: scale(1.05);
		}
		100% {
			opacity: 0.6;
			transform: scale(0.95);
		}
	}
</style>
