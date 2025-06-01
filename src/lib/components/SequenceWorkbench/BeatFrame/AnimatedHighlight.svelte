<script lang="ts">
	const props = $props<{
		active: boolean;
		color: 'blue' | 'red';
		pulseEffect?: boolean;
	}>();

	const colorMap: Record<'blue' | 'red', string> = {
		blue: 'rgba(59, 130, 246, 0.6)',
		red: 'rgba(239, 68, 68, 0.6)'
	};

	const backgroundColor = $derived(colorMap[props.color as 'blue' | 'red']);
</script>

{#if props.active}
	<div
		class="animated-highlight"
		class:pulse={props.pulseEffect}
		style:background-color={backgroundColor}
	></div>
{/if}

<style>
	.animated-highlight {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 6px;
		opacity: 0.3;
		transition: opacity 0.2s ease;
		pointer-events: none;
		z-index: 1;
	}

	.animated-highlight.pulse {
		animation: pulse-highlight 0.5s ease-out;
	}

	@keyframes pulse-highlight {
		0% {
			opacity: 0.3;
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.05);
		}
		100% {
			opacity: 0.3;
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.animated-highlight {
			animation: none;
			transition: none;
		}
	}
</style>
