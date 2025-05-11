<!-- src/lib/components/SequenceWorkbench/ToolsPanel/ToolsPanel.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { ButtonDefinition, ActionEventDetail } from '../ButtonPanel/types';

	// Props
	export let buttons: ButtonDefinition[] = [];
	export let activeMode: 'construct' | 'generate' | null = null;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		action: ActionEventDetail;
		close: void;
	}>();

	// Handle button click directly
	function handleToolClick(id: string) {
		dispatch('action', { id });
	}

	// Close tools panel
	function handleClose() {
		dispatch('close');
	}

	// Organize buttons in logical groups
	const modeButtons = buttons.filter((b) => ['constructMode', 'generateMode'].includes(b.id));
	const sharingButtons = buttons.filter((b) => ['viewFullScreen', 'saveImage'].includes(b.id));
	const manipulationButtons = buttons.filter((b) =>
		['mirrorSequence', 'swapColors', 'rotateSequence'].includes(b.id)
	);
	const dictionaryButtons = buttons.filter((b) => ['addToDictionary'].includes(b.id));
	const destructiveButtons = buttons.filter((b) => ['deleteBeat', 'clearSequence'].includes(b.id));
	const orderedButtons = [
		...modeButtons,
		...sharingButtons,
		...manipulationButtons,
		...dictionaryButtons,
		...destructiveButtons
	];

	let gridContainer: HTMLDivElement;

	// Debounce function to prevent too many layout updates
	function debounce<T extends (...args: any[]) => any>(
		func: T,
		wait: number
	): (...args: Parameters<T>) => void {
		let timeout: ReturnType<typeof setTimeout> | undefined;
		return function executedFunction(...args: Parameters<T>): void {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	// Modern grid layout function with better calculations
	function updateGridLayout() {
		if (!gridContainer) return;

		const containerWidth = gridContainer.clientWidth;
		const containerHeight = gridContainer.clientHeight;
		const buttonCount = orderedButtons.length;

		// Determine gap and padding based on container size
		const gap = containerWidth < 480 ? 6 : containerWidth < 768 ? 8 : 12;
		const padding = containerWidth < 480 ? 4 : containerWidth < 768 ? 6 : 8;

		// Set these values as CSS variables
		gridContainer.style.setProperty('--grid-gap', `${gap}px`);
		gridContainer.style.setProperty('--grid-padding', `${padding}px`);

		// Calculate available space
		const availableWidth = containerWidth - padding * 2;
		const availableHeight = containerHeight - padding * 2;

		// Calculate the minimum number of columns needed based on button count
		// We need to ensure all buttons fit without overlapping
		const minButtonSize = 70; // Absolute minimum size for a button
		const maxButtonsPerRow = Math.floor(availableWidth / minButtonSize);

		// Calculate minimum columns needed to fit all buttons
		const minColumnsNeeded = Math.ceil(buttonCount / Math.floor(availableHeight / minButtonSize));

		// Calculate ideal columns based on container width and minimum button size
		const idealColumns = Math.max(
			1, // At least 1 column
			Math.min(
				buttonCount, // Don't exceed button count
				maxButtonsPerRow // Don't exceed what can fit horizontally
			)
		);

		// Determine final column count based on container dimensions and button count
		let columns;

		// For very small screens
		if (containerWidth < 320) {
			columns = Math.min(2, buttonCount);
		}
		// For mobile screens (target 3x3 layout if possible)
		else if (containerWidth < 600) {
			columns = Math.min(3, buttonCount, maxButtonsPerRow);
		}
		// For medium screens
		else if (containerWidth < 900) {
			columns = Math.min(4, buttonCount, maxButtonsPerRow);
		}
		// For large screens
		else {
			columns = Math.min(5, buttonCount, maxButtonsPerRow);
		}

		// Ensure we have at least the minimum columns needed
		columns = Math.max(columns, minColumnsNeeded);

		// Log column calculation for debugging
		console.debug(
			`ToolsPanel columns: ideal=${idealColumns}, min=${minColumnsNeeded}, max=${maxButtonsPerRow}, final=${columns}`
		);

		// Calculate rows needed based on final column count
		const rows = Math.ceil(buttonCount / columns);

		// Calculate available space per button, accounting for gaps
		// Subtract the total gap space from available dimensions
		const availableWidthForButtons = availableWidth - gap * (columns - 1);
		const availableHeightForButtons = availableHeight - gap * (rows - 1);

		// Calculate maximum button dimensions that would fit
		const maxButtonWidth = availableWidthForButtons / columns;
		const maxButtonHeight = availableHeightForButtons / rows;

		// Use the smaller dimension to ensure buttons fit and remain square
		// Floor the value to avoid fractional pixels
		let buttonSize = Math.floor(Math.min(maxButtonWidth, maxButtonHeight));

		// Set reasonable limits
		const minSize = 44; // Minimum touch target size for accessibility
		const maxSize = containerWidth < 600 ? 90 : 160; // Limit size based on screen

		// Ensure button size is within limits
		buttonSize = Math.max(minSize, Math.min(buttonSize, maxSize));

		// Log button size calculation for debugging
		console.debug(`ToolsPanel button size: ${buttonSize}px for ${columns}x${rows} grid`);

		// Set CSS variables for the grid
		gridContainer.style.setProperty('--button-size', `${buttonSize}px`);
		gridContainer.style.setProperty('--columns', `${columns}`);

		// Log layout information for debugging
		console.debug(`ToolsPanel layout: ${columns}x${rows} grid, ${buttonSize}px buttons`);
	}

	// Create debounced version for better performance
	const debouncedUpdateLayout = debounce(updateGridLayout, 100);

	onMount(() => {
		// Initial layout calculation
		updateGridLayout();

		// Create a ResizeObserver with the debounced update function
		const resizeObserver = new ResizeObserver(() => {
			debouncedUpdateLayout();
		});

		// Observe the grid container for size changes
		if (gridContainer) {
			resizeObserver.observe(gridContainer);
		}

		// Also observe the parent container if possible
		const parentContainer = gridContainer?.parentElement;
		if (parentContainer) {
			resizeObserver.observe(parentContainer);
		}

		// Clean up on component destruction
		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div class="tools-panel" transition:fly={{ y: 20, duration: 300 }}>
	<div class="tools-header">
		<h2>Tools</h2>
		<button class="close-button" on:click={handleClose} aria-label="Close tools panel"> ✕ </button>
	</div>

	<div class="tools-content">
		<div class="tools-grid" bind:this={gridContainer}>
			{#each orderedButtons as button}
				<button
					class="tool-button {button.id.includes('delete') || button.id.includes('clear')
						? 'destructive'
						: ''} {(button.id === 'constructMode' && activeMode === 'construct') ||
					(button.id === 'generateMode' && activeMode === 'generate')
						? 'active-mode'
						: ''}"
					on:click={() => handleToolClick(button.id)}
					style="--button-color: {button.color}"
					title={button.title}
					aria-label={button.title}
				>
					<i class="fa-solid {button.id === 'saveImage' ? 'fa-share-nodes' : button.icon}"></i>
					<span class="button-title">{button.title}</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.tools-panel {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: transparent; /* Changed to transparent */
		border-radius: 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		/* Added to ensure it fills the container properly */
		position: relative;
		flex: 1;
	}

	.tools-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 12px;
		background: linear-gradient(135deg, rgba(106, 17, 203, 0.85), rgba(37, 117, 252, 0.85));
		color: white;
		backdrop-filter: blur(3px); /* Add a blur effect to the header */
	}

	.tools-header h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.close-button {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		border-radius: 50%;
		width: 28px;
		height: 28px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		color: white;
		font-weight: bold;
		transition: all 0.2s ease;
		font-size: 12px;
	}

	.close-button:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	.tools-content {
		flex: 1;
		padding: 8px;
		display: flex;
		flex-direction: column;
		overflow: auto; /* Allow scrolling if needed */
		background: transparent; /* Ensure content background is also transparent */
	}

	.tools-grid {
		display: grid;
		/* Modern approach using auto-fill and minmax for truly responsive layouts */
		grid-template-columns: repeat(var(--columns, 3), 1fr);
		gap: var(--grid-gap, 12px);
		justify-content: center;
		align-content: center; /* Center content vertically */
		width: 100%;
		height: 100%;
		padding: var(--grid-padding, 8px);
		box-sizing: border-box;
		/* Added to ensure it fills the container properly */
		flex: 1;
		min-height: 0;
		/* Allow overflow in case of extreme sizing issues, but hide scrollbars */
		overflow: auto;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE and Edge */
	}

	/* Hide scrollbar for Chrome, Safari and Opera */
	.tools-grid::-webkit-scrollbar {
		display: none;
	}

	.tool-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%; /* Fill the grid cell width */
		aspect-ratio: 1 / 1; /* Keep buttons square */
		border: 1px solid rgba(238, 238, 238, 0.7);
		background: rgba(248, 249, 250, 0.8); /* Semi-transparent background */
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #333;
		padding: var(--button-padding, 6px);
		box-sizing: border-box;
		position: relative;
		backdrop-filter: blur(2px); /* Add a slight blur effect */
		/* Ensure minimum touch target size for accessibility */
		min-width: 44px;
		min-height: 44px;
		/* Prevent text from overflowing */
		overflow: hidden;
		/* Ensure content scales properly */
		font-size: calc(var(--button-size, 80px) * 0.12);
	}

	/* Special styling for mode buttons */
	.tool-button[title='Construct'],
	.tool-button[title='Generate'] {
		background: rgba(255, 255, 255, 0.9);
		border-width: 2px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	/* Active mode styling */
	.tool-button.active-mode {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 255, 0.95));
		border-color: var(--button-color, #4361ee);
		box-shadow:
			0 0 0 2px rgba(67, 97, 238, 0.3),
			0 4px 12px rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
	}

	.tool-button:hover {
		background: rgba(255, 255, 255, 0.9);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-color: var(--button-color, #555);
		transform: translateY(-2px);
	}

	.tool-button:active {
		transform: scale(0.95);
	}

	.tool-button i {
		font-size: var(--icon-size, 24px);
		color: var(--button-color, #555);
		margin-bottom: 6px;
		/* Use modern fluid typography */
		font-size: clamp(18px, calc(var(--button-size, 80px) * 0.3), 32px);
	}

	.button-title {
		font-size: var(--title-size, 11px);
		text-align: center;
		line-height: 1.2;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		/* Use modern fluid typography */
		font-size: clamp(9px, calc(var(--button-size, 80px) * 0.12), 14px);
		/* Add padding to prevent text from touching edges */
		padding: 0 2px;
	}

	.destructive {
		background-color: rgba(255, 245, 245, 0.8);
		border-color: rgba(255, 224, 224, 0.7);
	}

	.destructive:hover {
		background-color: rgba(255, 240, 240, 0.9);
	}

	/* Modern container-based responsive design */
	/* Small screens and mobile devices */
	@media (max-width: 480px) {
		.tools-panel {
			border-radius: 6px; /* Smaller border radius */
		}

		.tools-header {
			padding: 8px 10px; /* Smaller padding */
		}

		.tools-header h2 {
			font-size: 1rem; /* Smaller font size */
		}
	}

	/* Medium screens */
	@media (min-width: 481px) and (max-width: 768px) {
		.tools-panel {
			border-radius: 8px;
		}
	}

	/* Large screens */
	@media (min-width: 769px) {
		.tools-grid {
			/* Allow more space between buttons on larger screens */
			gap: var(--grid-gap, 12px);
		}
	}

	/* Extra large screens */
	@media (min-width: 1200px) {
		.tools-grid {
			gap: var(--grid-gap, 16px);
		}
	}

	/* Handle portrait vs landscape orientation */
	@media (orientation: portrait) and (max-width: 768px) {
		.tools-grid {
			/* Optimize for vertical space in portrait mode */
			align-content: start;
		}
	}

	/* Handle high-density displays */
	@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
		.tool-button {
			/* Sharper borders on high-DPI screens */
			border-width: 0.5px;
		}
	}
</style>
