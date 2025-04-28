<!-- src/lib/components/OptionPicker/components/messages/EmptyMessage.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from '../../utils/a11y';
	import { emptyStateTransition } from '../../utils/transitions';

	export let type: 'empty' | 'initial' = 'empty';
	export let message: string = 'No options available';
</script>

<div
	class="message-container {type} transition-optimized"
	in:emptyStateTransition={{ duration: $prefersReducedMotion ? 0 : 400 }}
	out:fade={{ duration: $prefersReducedMotion ? 0 : 200, easing: cubicOut }}
>
	{message}
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

	.message-container.empty {
		font-style: italic;
	}

	.message-container.initial {
		font-style: italic;
		color: #9ca3af;
	}

	/* Performance optimizations */
	.transition-optimized {
		will-change: transform, opacity;
		backface-visibility: hidden;
		transform: translateZ(0); /* Hardware acceleration hint */
	}
</style>
