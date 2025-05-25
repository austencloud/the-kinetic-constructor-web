<!-- src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/TabsTooltip.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';

	// Props
	const props = $props<{
		show: boolean;
		categoryCount: number;
	}>();
</script>

{#if props.show && props.categoryCount > 1}
	<div class="tabs-tooltip" transition:fade={{ duration: 300 }}>
		<div class="tooltip-content">
			Explore {props.categoryCount} categories
		</div>
	</div>
{/if}

<style>
	/* Tooltip for category exploration */
	.tabs-tooltip {
		position: absolute;
		top: -40px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(15, 23, 42, 0.9);
		border: 1px solid #38bdf8;
		border-radius: 8px;
		padding: 6px 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
		z-index: 20;
		pointer-events: none;
	}

	.tooltip-content {
		color: #f8fafc;
		font-size: 0.85rem;
		white-space: nowrap;
	}

	.tooltip-content::after {
		content: '';
		position: absolute;
		bottom: -8px;
		left: 50%;
		transform: translateX(-50%);
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-top: 8px solid rgba(15, 23, 42, 0.9);
	}

	/* Mobile styles */
	@media (max-width: 640px) {
		/* Adjust tooltip position */
		.tabs-tooltip {
			top: -35px;
			padding: 4px 8px;
		}

		.tooltip-content {
			font-size: 0.75rem;
		}
	}
</style>
