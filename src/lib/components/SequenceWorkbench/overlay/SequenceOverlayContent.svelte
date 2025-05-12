<script lang="ts">
	import BeatFrame from '../BeatFrame/BeatFrame.svelte';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';

	// Props
	const { title = $bindable('') } = $props<{
		title?: string;
	}>();
</script>

<div class="fullscreen-beat-container" data-beat-count={sequenceContainer.state.beats.length}>
	<!-- Use a special layout mode for fullscreen display -->
	<div class="overlay-grid-container">
		<!-- Regular beats only (no start position) -->
		{#each sequenceContainer.state.beats as beat, index}
			<div class="overlay-grid-item">
				<div class="pictograph-container">
					<Pictograph
						pictographData={{
							letter: beat.metadata?.letter || null,
							startPos: beat.metadata?.startPos || null,
							endPos: beat.metadata?.endPos || null,
							gridMode: (beat.metadata?.gridMode || 'diamond') as any,
							redPropData: beat.redPropData || null,
							bluePropData: beat.bluePropData || null,
							redMotionData: beat.redMotionData || null,
							blueMotionData: beat.blueMotionData || null,
							redArrowData: beat.redArrowData || null,
							blueArrowData: beat.blueArrowData || null,
							grid: (beat.metadata?.grid || '') as string
						} as any}
						beatNumber={index + 1}
					/>
				</div>
			</div>
		{/each}
	</div>

	<!-- Keep the original BeatFrame for data, but make it invisible -->
	<div class="hidden-beat-frame">
		<BeatFrame isScrollable={false} fullScreenMode={true} />
	</div>
</div>

<style>
	/* Full screen beat container styles */
	.fullscreen-beat-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0; /* Remove padding to maximize space */
		box-sizing: border-box;
		/* Ensure content is centered and as large as possible */
		position: relative;
		overflow: hidden; /* Prevent scrolling within the container */
		/* Default CSS variables for grid layout */
		--overlay-grid-columns: 4; /* Default number of columns */
		--overlay-cell-size: 120px; /* Default cell size */
		--overlay-grid-gap: 4px; /* Default gap between cells */
		/* Ensure the container takes up all available space */
		max-width: 100vw;
		max-height: 100vh;
		flex: 1;
	}

	/* New overlay grid container styles */
	.overlay-grid-container {
		display: grid;
		grid-template-columns: repeat(var(--overlay-grid-columns), var(--overlay-cell-size));
		grid-auto-rows: var(--overlay-cell-size);
		gap: var(--overlay-grid-gap);
		padding: 8px;
		width: auto;
		height: auto;
		max-width: 95vw;
		max-height: 85vh;
		justify-content: center;
		align-items: center;
		overflow: auto;
	}

	.overlay-grid-item {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		overflow: hidden;
	}

	.pictograph-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 5px;
		box-sizing: border-box;
	}

	/* Style for pictograph components in the overlay */
	:global(.pictograph-container .pictograph) {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
	}

	.hidden-beat-frame {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		opacity: 0;
		pointer-events: none;
	}

	/* Adjust grid layout based on number of pictographs */
	.fullscreen-beat-container[data-beat-count='1'] .overlay-grid-container {
		--overlay-grid-columns: 1; /* 1 pictograph: 1 column */
		--overlay-cell-size: min(200px, 40vw); /* Larger cells for fewer pictographs */
	}

	.fullscreen-beat-container[data-beat-count='2'] .overlay-grid-container {
		--overlay-grid-columns: 2; /* 2 pictographs: 2 columns */
		--overlay-cell-size: min(180px, 35vw);
	}

	.fullscreen-beat-container[data-beat-count='3'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='4'] .overlay-grid-container {
		--overlay-grid-columns: 2; /* 3-4 pictographs: 2 columns */
		--overlay-cell-size: min(160px, 30vw);
	}

	.fullscreen-beat-container[data-beat-count='5'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='6'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='7'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='8'] .overlay-grid-container {
		--overlay-grid-columns: 4; /* 5-8 pictographs: 4 columns (4x2 grid) */
		--overlay-cell-size: min(140px, 22vw);
	}

	.fullscreen-beat-container[data-beat-count='9'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='10'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='11'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='12'] .overlay-grid-container {
		--overlay-grid-columns: 4; /* 9-12 pictographs: 4 columns (4x3 grid) */
		--overlay-cell-size: min(130px, 20vw);
	}

	.fullscreen-beat-container[data-beat-count='13'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='14'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='15'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='16'] .overlay-grid-container {
		--overlay-grid-columns: 4; /* 13-16 pictographs: 4 columns (4x4 grid) */
		--overlay-cell-size: min(120px, 18vw);
	}

	.fullscreen-beat-container[data-beat-count='17'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='18'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='19'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='20'] .overlay-grid-container {
		--overlay-grid-columns: 5; /* 17-20 pictographs: 5 columns */
		--overlay-cell-size: min(110px, 16vw);
	}

	.fullscreen-beat-container[data-beat-count='21'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='22'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='23'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='24'] .overlay-grid-container {
		--overlay-grid-columns: 6; /* 21-24 pictographs: 6 columns */
		--overlay-cell-size: min(100px, 14vw);
	}

	.fullscreen-beat-container[data-beat-count='25'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='26'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='27'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='28'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='29'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='30'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='31'] .overlay-grid-container,
	.fullscreen-beat-container[data-beat-count='32'] .overlay-grid-container {
		--overlay-grid-columns: 8; /* 25-32 pictographs: 8 columns */
		--overlay-cell-size: min(90px, 12vw);
	}

	/* Handle landscape orientation specifically */
	@media (orientation: landscape) {
		.overlay-grid-container {
			max-height: 80vh; /* Further reduce height in landscape */
			/* Increase columns in landscape mode */
			--overlay-grid-columns: calc(var(--overlay-grid-columns) + 2);
			/* Reduce gap in landscape to fit more pictographs */
			--overlay-grid-gap: 2px;
		}

		/* Adjust cell sizes in landscape for different beat counts */
		.fullscreen-beat-container[data-beat-count='1'] .overlay-grid-container {
			--overlay-grid-columns: 1; /* Keep 1 column for single pictograph */
			--overlay-cell-size: min(180px, 30vw); /* Slightly smaller in landscape */
		}

		.fullscreen-beat-container[data-beat-count='2'] .overlay-grid-container {
			--overlay-grid-columns: 2; /* Keep 2 columns for 2 pictographs */
			--overlay-cell-size: min(160px, 25vw);
		}

		.fullscreen-beat-container[data-beat-count='3'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='4'] .overlay-grid-container {
			--overlay-grid-columns: 4; /* Use 4 columns in landscape for 3-4 pictographs */
			--overlay-cell-size: min(140px, 22vw);
		}

		.fullscreen-beat-container[data-beat-count='5'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='6'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='7'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='8'] .overlay-grid-container {
			--overlay-grid-columns: 4; /* Keep 4 columns for 5-8 pictographs */
			--overlay-cell-size: min(130px, 20vw);
		}

		.fullscreen-beat-container[data-beat-count='9'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='10'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='11'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='12'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='13'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='14'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='15'] .overlay-grid-container,
		.fullscreen-beat-container[data-beat-count='16'] .overlay-grid-container {
			--overlay-grid-columns: 8; /* Use 8 columns for 9-16 pictographs in landscape */
			--overlay-cell-size: min(110px, 16vw);
		}
	}

	/* Handle small height screens in landscape */
	@media (orientation: landscape) and (max-height: 600px) {
		.overlay-grid-container {
			max-height: 75vh; /* Even smaller on very small screens */
			max-width: 95vw; /* Also reduce width slightly */
			/* Further reduce padding on small screens */
			padding: 4px;
			/* Reduce cell size on small screens */
			--overlay-cell-size: min(var(--overlay-cell-size), 18vw);
		}
	}

	:global(.fullscreen-beat-container .beat-frame-container) {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		/* Remove padding to maximize space */
		padding: 0;
		box-sizing: border-box;
		/* Ensure container takes up full width */
		min-width: 100%;
		/* Add overflow handling to prevent layout issues */
		overflow: hidden;
	}

	/* Ensure pictographs in fullscreen mode are properly sized */
	:global(.fullscreen-beat-container .pictograph) {
		width: 100%;
		height: 100%;
		/* Ensure the pictograph scales properly */
		transform-origin: center center;
		/* Prevent pictographs from overflowing their cells */
		overflow: hidden;
		/* Add a subtle transition for smoother resizing */
		transition: transform 0.2s ease-out;
	}

	/* Responsive adjustments for different screen sizes */
	@media (max-width: 768px) {
		.overlay-grid-container {
			/* Reduce gap on mobile to fit more pictographs */
			--overlay-grid-gap: 2px;
			/* Reduce padding on mobile */
			padding: 4px;
			/* Adjust cell size for mobile */
			--overlay-cell-size: min(var(--overlay-cell-size), 20vw);
		}

		.overlay-grid-item {
			border-radius: 4px;
		}
	}

	/* Handle very small screens */
	@media (max-width: 480px) {
		.overlay-grid-container {
			/* Minimal gap on very small screens */
			--overlay-grid-gap: 1px;
			/* Minimal padding on very small screens */
			padding: 2px;
			/* Further reduce cell size on very small screens */
			--overlay-cell-size: min(var(--overlay-cell-size), 18vw);
		}

		.overlay-grid-item {
			border-radius: 2px;
		}
	}

	/* Handle landscape orientation on mobile devices */
	@media (orientation: landscape) and (max-height: 500px) {
		.overlay-grid-container {
			/* No padding on very short screens */
			padding: 0;
			/* No gap on very short screens */
			--overlay-grid-gap: 0;
			/* Smallest cell size on very short screens */
			--overlay-cell-size: min(var(--overlay-cell-size), 16vw);
		}

		.overlay-grid-item {
			border-radius: 0;
		}
	}
</style>
