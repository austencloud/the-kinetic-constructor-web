<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Arrow from './Arrow/Arrow.svelte';
	import Prop from './Prop/Prop.svelte';
	import { Motion } from './Motion/Motion';
	import PictographView from './PictographView.svelte';
	import type { Orientation, PropType } from './Prop/PropTypes';
	import type { PropRotDir } from './Motion/MotionInterface';

	export let pictographData: any;
	export let isSelected: boolean = false;
	export let name: string | null = null;
	export let interactive: boolean = true;
	export let onClick: () => void;

	let gridPoints: Record<string, { x: number; y: number }> = {};
	let motions: Motion[] = [];
	let currentPictograph: any;

	/**
	 * Creates a Motion instance and binds Arrow and Prop components.
	 *
	 * @param data Motion-related data
	 * @param color Motion color ('red' | 'blue')
	 * @param propType Type of the prop ('hand', 'staff', etc.)
	 * @param startOri Initial orientation ('in' | 'out' | ...)
	 * @param propRotDir Rotation direction ('cw' | 'ccw')
	 * @returns Motion instance
	 */
	function createMotion(
		data: any,
		color: 'red' | 'blue',
		propType: PropType,
		startOri: Orientation,
		propRotDir: PropRotDir
	): Motion {
		const motion = new Motion({
			pictograph: currentPictograph,
			motionType: data?.motion?.type || 'static',
			startLoc: data?.motion?.startLoc || 'n',
			endLoc: data?.motion?.endLoc || 's',
			startOri,
			propRotDir,
			color,
			turns: 0,
			leadState: color === 'red' ? 'leading' : 'trailing',
			prefloatMotionType: null,
			prefloatPropRotDir: null,
			handRotDir: propRotDir === 'cw' ? 'cw_handpath' : 'ccw_handpath'
		});

		// Arrow and Prop will be instantiated declaratively in the markup
		motion.arrow = null;
		motion.prop = null;

		return motion;
	}

	/**
	 * Processes the input pictograph data to initialize motions.
	 */
	function processPictographData(data: any) {
		if (!data) return;

		motions = [
			createMotion(data.red_attributes, 'red', 'hand', 'in', 'cw'),
			createMotion(data.blue_attributes, 'blue', 'staff', 'out', 'ccw')
		];
	}

	// Reactively process data
	$: processPictographData(pictographData);

	/**
	 * Updates grid points when they are ready.
	 */
	function handleGridPointsReady(points: any) {
		gridPoints = { ...points };
	}
</script>

<PictographView bind:this={currentPictograph} {isSelected} {interactive} {onClick} {name}>
	<div class="pictograph">
		<Grid gridMode={pictographData?.grid_mode || 'diamond'} onPointsReady={handleGridPointsReady} />
		{#each motions as motion}
			<Arrow {motion} />
			<Prop {motion} />
		{/each}
	</div>
</PictographView>

<style>
	.pictograph {
		position: relative;
		width: 100%;
		height: 100%;
		background-color: white;
	}
</style>
