<!-- src/lib/components/Pictograph/components/PictographComponentRenderer.svelte -->
<script lang="ts">
	import { popIn } from '$lib/transitions/popIn';
	import type { PictographData } from '$lib/types/PictographData';
	import type { GridData } from '$lib/components/objects/Grid/GridData';
	import type { PropData } from '$lib/components/objects/Prop/PropData';
	import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
	import type { PictographService } from '../PictographService';

	// Component imports
	import Grid from '../../objects/Grid/Grid.svelte';
	import Prop from '../../objects/Prop/Prop.svelte';
	import Arrow from '../../objects/Arrow/Arrow.svelte';
	import TKAGlyph from '../../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import BeatLabel from './BeatLabel.svelte';

	// Utility imports
	import { shouldShowBeatLabel, shouldShowMotionComponents } from '../utils/PictographRenderUtils';
	import { svgPreloadingService } from '$lib/services/SvgPreloadingService';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		pictographData?: PictographData;
		currentState: string;
		showPictograph: boolean;
		service: PictographService | null;
		gridData: GridData | null;
		redPropData: PropData | null;
		bluePropData: PropData | null;
		redArrowData: ArrowData | null;
		blueArrowData: ArrowData | null;
		debug?: boolean;
		animationDuration?: number;
		beatNumber?: number | null;
		isStartPosition?: boolean;
		disableAnimations?: boolean;
		onGridLoaded: (data: GridData) => void;
		onComponentLoaded: (component: string) => void;
		onComponentError: (component: string, error: any) => void;
		onGlyphLoaded: (event: CustomEvent<boolean>) => void;
	}>();

	// Mobile detection
	function isMobile(): boolean {
		return (
			typeof window !== 'undefined' &&
			(window.innerWidth <= 768 ||
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
		);
	}
</script>

<Grid
	gridMode={props.pictographData?.gridMode}
	onPointsReady={props.onGridLoaded}
	onError={(message) => props.onComponentError('grid', message)}
	debug={props.debug ?? false}
/>

{#if shouldShowBeatLabel(props.beatNumber, props.isStartPosition)}
	<BeatLabel
		text={props.isStartPosition ? 'Start' : props.beatNumber?.toString() || ''}
		position="top-left"
		animationDuration={props.animationDuration ?? 200}
	/>
{/if}

{#if shouldShowMotionComponents(props.currentState)}
	<!-- Unified component rendering approach -->
	<g
		class="pictograph-components"
		class:hidden={!props.showPictograph}
		style="transform-origin: center center;"
		in:popIn={props.showPictograph && !props.disableAnimations && !svgPreloadingService.isReady()
			? {
					duration: props.animationDuration ?? 200,
					start: 0.85,
					opacity: 0.2
				}
			: undefined}
	>
		{#if props.pictographData?.letter}
			<TKAGlyph
				letter={props.pictographData.letter}
				turnsTuple="(s, 0, 0)"
				x={50}
				y={800}
				scale={1}
				onloaded={(success) => {
					// Create a CustomEvent to match the expected interface
					const event = new CustomEvent('loaded', { detail: success });
					props.onGlyphLoaded(event);
				}}
			/>
		{/if}

		{#each [{ color: 'red', propData: props.redPropData, arrowData: props.redArrowData }, { color: 'blue', propData: props.bluePropData, arrowData: props.blueArrowData }] as { color, propData, arrowData } (color)}
			{#if propData}
				<Prop
					{propData}
					animationDuration={props.showPictograph
						? props.disableAnimations
							? 0
							: (props.animationDuration ?? 200)
						: 0}
					loaded={() => props.onComponentLoaded(`${color}Prop`)}
					error={(e) => props.onComponentError(`${color}Prop`, e)}
				/>
			{/if}

			{#if arrowData}
				{#each [`${arrowData.id}-${arrowData.turns}-${arrowData.propRotDir}-${arrowData.motionType}-${color}`] as arrowKey (arrowKey)}
					<Arrow
						{arrowData}
						loadTimeoutMs={isMobile() ? 2000 : 1000}
						pictographService={props.service}
						loaded={() => props.onComponentLoaded(`${color}Arrow`)}
						error={(e) => props.onComponentError(`${color}Arrow`, e)}
					/>
				{/each}
			{/if}
		{/each}
	</g>
{/if}

<style>
	.pictograph-components {
		transform-origin: center center;
	}

	.hidden {
		visibility: hidden;
		position: absolute;
		pointer-events: none;
	}
</style>
