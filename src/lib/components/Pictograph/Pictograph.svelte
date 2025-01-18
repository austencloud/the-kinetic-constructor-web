<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Arrow from './Arrow/Arrow.svelte';
	import Prop from './Prop/Prop.svelte';
	import { Motion } from './Motion/Motion';
	import PictographView from './PictographView.svelte';
	import type { Orientation, PropType } from './Prop/PropTypes';
	import type { PropRotDir } from './Motion/MotionInterface';

	export let pictographData: any; // Input pictograph data
	export let isSelected: boolean = false;
	export let name: string | null = null;
	export let interactive: boolean = true;
	export let onClick: () => void;

	let gridPoints: Record<string, { x: number; y: number }> = {}; // Grid points data
	let motions: Motion[] = []; // List of motions
	let currentPictograph: any; // Reference to the current Pictograph instance

	/**
	 * Creates a Motion instance and initializes its associated Arrow and Prop components.
	 *
	 * @param data Motion-related data
	 * @param color Color of the motion (red/blue)
	 * @param propType Type of the prop (e.g., hand, staff)
	 * @param startOri Initial orientation of the motion
	 * @param propRotDir Rotation direction of the prop (cw/ccw)
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

		// Initialize and bind the Arrow instance
		const arrow = new Arrow({
			target: document.body,
			props: {
				motion,
				color,
				position: { x: 0, y: 0 },
				rotation: 0,
				mirrored: false
			}
		});

		// Initialize and bind the Prop instance
		const prop = new Prop({
			target: document.body,
			props: {
				motion,
				propType: propType as PropType, // Explicitly cast to PropType
				color,
				loc: color === 'red' ? 'n' : 's',
				ori: color === 'red' ? 'in' : 'out',
				size: { width: 50, height: 50 }
			}
		});

		// Establish relationships between Motion, Arrow, and Prop
		motion.attachComponents(arrow, prop);
		return motion;
	}

	/**
	 * Processes the input pictograph data to initialize motions, arrows, and props.
	 *
	 * @param data Pictograph data
	 */
	function processPictographData(data: any) {
		if (!data) return;

		motions = [
			createMotion(data.red_attributes, 'red', 'staff', 'in', 'cw'),
			createMotion(data.blue_attributes, 'blue', 'staff', 'out', 'ccw')
		];
	}

	// Reactively process pictograph data when it changes
	$: processPictographData(pictographData);

	/**
	 * Handles the grid points being ready and updates the `gridPoints` reference.
	 *
	 * @param points The updated grid points
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
