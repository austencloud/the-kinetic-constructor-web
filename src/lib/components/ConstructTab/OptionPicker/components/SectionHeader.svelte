<script lang="ts">
	// Removed fade import
	import { formatStyledHeader } from '../utils/headerUtils'; // Import the utility

	export let groupKey: string; // The key for this header (e.g., "Type1")
	export let isFirstHeader: boolean = false; // To adjust top margin
</script>

<div
	class="section-header-container"
	class:first={isFirstHeader}
>
	<span class="section-header">
		{@html formatStyledHeader(groupKey)}
	</span>
</div>

<style>
	.section-header-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		padding: 0;
		margin-top: 1.5rem; /* Keep the improved top margin */
		margin-bottom: 0.75rem; /* Keep the improved bottom margin */
		position: relative;
		z-index: 5;
	}

	.section-header-container.first {
		margin-top: 0.5rem; /* Less top margin for the very first header */
	}

	.section-header {
		display: inline-block;
		background-color: rgba(255, 255, 255, 0.9); /* Restored original light background */
		color: #1e293b; /* Restored original dark text */
		padding: 6px 18px; /* Restored original padding */
		border-radius: 9999px;
		font-size: 0.9rem; /* Restored original font size */
		font-weight: 500; /* Restored original font weight */
		text-align: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Restored original shadow */
		pointer-events: auto;
		border: 1px solid rgba(0, 0, 0, 0.1); /* Restored original border */
		white-space: nowrap;
	}
</style>