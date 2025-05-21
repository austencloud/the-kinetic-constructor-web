<!-- src/lib/components/SequenceWorkbench/GraphEditor/UShapedLayout.svelte -->
<script lang="ts">
	import TurnsBox from './TurnsBox/TurnsBox.svelte';
	import PictographSection from './PictographSection.svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { browser } from '$app/environment';
	import type { PictographData } from '$lib/types/PictographData';
	import type { PropRotDir } from '$lib/types/Types';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		pictographData: PictographData;
		pictographSize: number;
		onTurnsChanged: (data: { color: 'blue' | 'red'; turns: any }) => void;
		onDirectionChanged: (data: { color: 'blue' | 'red'; direction: PropRotDir }) => void;
	}>();

	// Handle turns changed event
	function handleTurnsChanged(data: { color: 'blue' | 'red'; turns: any }) {
		if (props.onTurnsChanged) {
			props.onTurnsChanged(data);
		}
	}

	// Handle direction changed event
	function handleDirectionChanged(data: { color: 'blue' | 'red'; direction: any }) {
		if (props.onDirectionChanged) {
			props.onDirectionChanged(data);
		}
	}

	// Reactive state for screen size
	let containerWidth = 0;

	// Update screen size state when component mounts
	$effect(() => {
		if (browser) {
			const updateScreenSize = () => {
				containerWidth = window.innerWidth;
			};

			// Initial check
			updateScreenSize();

			// Add resize listener
			window.addEventListener('resize', updateScreenSize);

			// Cleanup
			return () => {
				window.removeEventListener('resize', updateScreenSize);
			};
		}
	});

	// Calculate the optimal pictograph size based on container width
	const optimalPictographSize = $derived(() => {
		// Default to the provided pictograph size
		if (!browser || containerWidth === 0) return props.pictographSize;

		// For very small screens, use a smaller pictograph
		if (containerWidth < 360) {
			return Math.min(props.pictographSize, containerWidth * 0.4);
		}

		// For small screens, use a medium-sized pictograph
		if (containerWidth < 480) {
			return Math.min(props.pictographSize, containerWidth * 0.45);
		}

		// For larger screens, use the provided pictograph size
		return props.pictographSize;
	});
</script>

<div class="u-shaped-layout" in:fade={{ duration: 200, delay: 100, easing: cubicOut }}>
	<!-- Top row with pictograph in the center -->
	<div class="top-row">
		<!-- Left side (Blue TurnsBox header) -->
		<div class="blue-header-container">
			<div class="turns-box-header blue">
				<TurnsBox
					color="blue"
					onTurnsChanged={handleTurnsChanged}
					onDirectionChanged={handleDirectionChanged}
					layoutMode="header-only"
				/>
			</div>
		</div>

		<!-- Center (Pictograph) -->
		<div class="pictograph-container-wrapper">
			<div
				class="pictograph-container"
				style="width: {optimalPictographSize}px; height: {optimalPictographSize}px;"
			>
				<PictographSection pictographData={props.pictographData} isStartPosition={false} />
			</div>
		</div>

		<!-- Right side (Red TurnsBox header) -->
		<div class="red-header-container">
			<div class="turns-box-header red">
				<TurnsBox
					color="red"
					onTurnsChanged={handleTurnsChanged}
					onDirectionChanged={handleDirectionChanged}
					layoutMode="header-only"
				/>
			</div>
		</div>
	</div>

	<!-- Bottom row with TurnsBox controls -->
	<div class="bottom-row">
		<!-- Blue TurnsBox controls -->
		<div class="turns-box-container blue-box">
			<TurnsBox
				color="blue"
				onTurnsChanged={handleTurnsChanged}
				onDirectionChanged={handleDirectionChanged}
				layoutMode="controls-only"
			/>
		</div>

		<!-- Red TurnsBox controls -->
		<div class="turns-box-container red-box">
			<TurnsBox
				color="red"
				onTurnsChanged={handleTurnsChanged}
				onDirectionChanged={handleDirectionChanged}
				layoutMode="controls-only"
			/>
		</div>
	</div>
</div>

<style>
	.u-shaped-layout {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		gap: 0.5rem;
	}

	.top-row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
	}

	.blue-header-container,
	.red-header-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.25rem;
		box-sizing: border-box;
		max-width: 40%;
	}

	.turns-box-header {
		width: 100%;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.pictograph-container-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 0.25rem;
		box-sizing: border-box;
		z-index: 2; /* Ensure pictograph is above other elements */
	}

	.pictograph-container {
		cursor: default;
		border: 3px solid gold;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		box-sizing: border-box;
		flex-shrink: 0;
		flex-grow: 0;
		/* Add subtle shadow for depth */
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.2),
			0 0 20px rgba(255, 215, 0, 0.15); /* Gold glow */
		/* Add transition for smoother resizing */
		transition: all 0.3s ease;
	}

	.bottom-row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: stretch;
		width: 100%;
		gap: 0.5rem;
		padding: 0 0.25rem;
		box-sizing: border-box;
		flex: 1;
	}

	.turns-box-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		box-sizing: border-box;
		max-width: 50%;
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.u-shaped-layout {
			gap: 0.25rem;
		}

		.top-row {
			padding: 0 0.25rem;
		}

		.bottom-row {
			gap: 0.25rem;
			padding: 0 0.25rem;
		}

		.blue-header-container,
		.red-header-container {
			max-width: 45%;
		}
	}

	@media (max-width: 400px) {
		.blue-header-container,
		.red-header-container {
			padding: 0 0.125rem;
			max-width: 48%;
		}

		.pictograph-container-wrapper {
			padding: 0 0.125rem;
		}

		.bottom-row {
			padding: 0 0.125rem;
		}
	}

	@media (max-width: 360px) {
		.u-shaped-layout {
			gap: 0.125rem;
		}

		.top-row {
			padding: 0 0.125rem;
		}

		.blue-header-container,
		.red-header-container {
			padding: 0;
			max-width: 50%;
		}

		.pictograph-container-wrapper {
			padding: 0;
		}

		.bottom-row {
			gap: 0.125rem;
			padding: 0;
		}

		.turns-box-container {
			max-width: 50%;
		}
	}
</style>
