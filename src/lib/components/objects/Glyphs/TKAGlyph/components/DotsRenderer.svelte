<!-- src/lib/components/objects/Glyphs/TKAGlyph/components/DotsRenderer.svelte -->
<script lang="ts">
	import { glyphContainer, type Rect } from '$lib/stores/glyphContainer.svelte';
	import { LetterType } from '$lib/types/LetterType';
	import type { Letter } from '$lib/types/Letter';
	import type { DirRelation, PropRotDir } from '$lib/types/Types';

	// Props using Svelte 5 runes
	const props = $props<{
		direction: DirRelation | PropRotDir | null;
		letterRect: Rect;
		letter: Letter | null;
		shouldShowDots: boolean;
	}>();

	// Config
	const DOT_PADDING = 20;

	// Calculate positions using functional approach with $derived
	const dotPositions = $derived(
		calculateDotPositions(props.letterRect, glyphContainer.cache.dotSVG?.dimensions)
	);
	const canShowDots = $derived(
		props.letter && LetterType.getLetterType(props.letter) !== LetterType.Type1
	);
	const dotsAvailable = $derived(glyphContainer.cache.dotSVG !== null);
	const dotsVisible = $derived(
		canShowDots && dotsAvailable && props.direction !== null && props.shouldShowDots
	);

	// Pure functions for calculations
	function calculateDotPositions(rect: Rect, dimensions?: { width: number; height: number }) {
		const dotDimensions = dimensions || { width: 20, height: 20 };

		if (!rect || rect.width === 0) {
			return { same: { x: 0, y: 0 }, opposite: { x: 0, y: 0 } };
		}

		const centerX = rect.left + rect.width / 2;

		return {
			same: {
				x: centerX,
				y: rect.top - DOT_PADDING - dotDimensions.height / 2
			},
			opposite: {
				x: centerX,
				y: rect.bottom + DOT_PADDING + dotDimensions.height / 2
			}
		};
	}
</script>

<g class="dot-renderer">
	{#if dotsVisible}
		<!-- Same Dot -->
		<g
			class="tka-dot"
			transform={`translate(${dotPositions.same.x}, ${dotPositions.same.y})`}
			opacity={props.direction === 's' ? 1 : 0}
		>
			<image
				href={glyphContainer.cache.dotSVG?.svg}
				width={glyphContainer.cache.dotSVG?.dimensions.width || 0}
				height={glyphContainer.cache.dotSVG?.dimensions.height || 0}
				x={-(glyphContainer.cache.dotSVG?.dimensions.width || 0) / 2}
				y={-(glyphContainer.cache.dotSVG?.dimensions.height || 0) / 2}
			/>
		</g>

		<!-- Opposite Dot -->
		<g
			class="tka-dot"
			transform={`translate(${dotPositions.opposite.x}, ${dotPositions.opposite.y})`}
			opacity={props.direction === 'o' ? 1 : 0}
		>
			<image
				href={glyphContainer.cache.dotSVG?.svg}
				width={glyphContainer.cache.dotSVG?.dimensions.width || 0}
				height={glyphContainer.cache.dotSVG?.dimensions.height || 0}
				x={-(glyphContainer.cache.dotSVG?.dimensions.width || 0) / 2}
				y={-(glyphContainer.cache.dotSVG?.dimensions.height || 0) / 2}
			/>
		</g>
	{/if}
</g>

<style>
	.tka-dot image {
		transform-box: fill-box;
		transform-origin: center;
	}
</style>
