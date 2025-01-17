<script lang="ts">
	import Grid from './Grid.svelte';
    let gridPoints: Record<string, { x: number; y: number }> = {};

	export let pictographData: any; // Pictograph data passed in
	export let onClick: (() => void) | undefined; // Optional click handler
	export let isSelected: boolean = false; // Highlight if selected
	export let name: string | null = null; // Optional name for display
	export let interactive: boolean = true; // Controls interactivity
	function handlePointsReady(points: { hand_points: { normal: Record<string, { x: number; y: number }>; strict: Record<string, { x: number; y: number }>; }; layer2_points: { normal: Record<string, { x: number; y: number }>; strict: Record<string, { x: number; y: number }>; }; outer_points: Record<string, string>; center_point: { x: number; y: number; }; }) {
		gridPoints = {
			...points.hand_points.normal,
			...points.hand_points.strict,
			...points.layer2_points.normal,
			...points.layer2_points.strict,
			...points.outer_points,
			center: points.center_point
		};
	}

</script>

<div
class="pictograph-wrapper"
class:selected={isSelected}
style="--cursor: {interactive ? 'pointer' : 'default'}; --hover-scale: {interactive
	? 'scale(1.05)'
	: 'none'};, --click-scale: {interactive ? 'scale(0.95)' : 'none'};"
on:click={interactive ? onClick : undefined}
on:keydown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick?.() : undefined}
role={interactive ? 'button' : undefined}
{...interactive ? { tabindex: 0 } : {}}
aria-pressed={isSelected}
>
	<div class="base-pictograph">
		<Grid gridMode={pictographData?.grid_mode || 'diamond'} onPointsReady={handlePointsReady} />
	</div>

	{#if name}
		<span class="pictograph-label">{name}</span>
	{/if}
</div>

<style>
	.pictograph-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: var(--cursor, default); /* Dynamic cursor */
		transition: transform 0.2s ease;
		color: white;
	}

	.pictograph-wrapper:hover {
		transform: var(--hover-scale, none);
	}
	.pictograph-wrapper:active {
		transform: var(--click-scale, none);
	}

	.base-pictograph {
		width: 100%;
		height: 100%;
		position: relative; /* Enables absolute positioning for child components */
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f0f0;
		overflow: hidden;
	}
</style>
