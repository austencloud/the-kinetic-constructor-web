<!-- src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/ScrollHint.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';

	// Props
	const props = $props<{
		direction: 'left' | 'right';
		show: boolean;
	}>();
</script>

{#if props.show}
	<div class="scroll-hint {props.direction}" transition:fade={{ duration: 200 }}>
		<div class="scroll-arrow">{props.direction === 'left' ? '←' : '→'}</div>
		<div class="scroll-hint-text">More</div>
	</div>
{/if}

<style>
	/* Scroll hint indicators */
	.scroll-hint {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(15, 23, 42, 0.8);
		border: 1px solid rgba(148, 163, 184, 0.3);
		border-radius: 8px;
		padding: 4px 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		pointer-events: none; /* Don't block clicks */
		color: #e2e8f0;
	}

	.scroll-hint.left {
		left: 0;
	}

	.scroll-hint.right {
		right: 0;
	}

	.scroll-arrow {
		font-size: 1.2rem;
		font-weight: bold;
		color: #38bdf8;
		margin-bottom: 2px;
	}

	.scroll-hint-text {
		font-size: 0.7rem;
		opacity: 0.8;
	}

	/* Very small screens */
	@media (max-width: 480px) {
		/* Hide scroll hint text on very small screens */
		.scroll-hint-text {
			display: none;
		}

		.scroll-hint {
			padding: 2px 4px;
		}
	}
</style>
