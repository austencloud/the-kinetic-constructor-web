<!-- src/lib/components/OptionPicker/utils/debugger/components/DebugToggleButton.svelte -->
<script lang="ts">
	// Props using Svelte 5 runes
	const {
		toggleInfo,
		title = 'Show layout debug info',
		ariaLabel = 'Show layout debug info'
	} = $props<{
		toggleInfo: () => void;
		title?: string;
		ariaLabel?: string;
	}>();
</script>

<button class="debug-layout-button" onclick={toggleInfo} {title} aria-label={ariaLabel}>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line
			x1="3"
			y1="9"
			x2="21"
			y2="9"
		></line><line x1="9" y1="21" x2="9" y2="9"></line></svg
	>
</button>

<style>
	.debug-layout-button {
		background: #1e293b;
		color: white;
		border: 1px solid #334155;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		cursor: pointer;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
		transition: all 0.2s ease;
	}

	.debug-layout-button:hover {
		opacity: 1;
		background: #334155;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
		transform: scale(1.05);
	}

	.debug-layout-button svg {
		width: 16px;
		height: 16px;
	}
</style>
