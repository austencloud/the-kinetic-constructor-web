<script lang="ts">
	import Beat, { type BeatData } from './Beat.svelte';

	// For the special "start pos" label if we want to show "Start"
	export let label: string = 'Start';

	// Parent can pass an onClick if desired,
	// or we default to a no-op if it shouldn’t do anything special
	export let onClick: (beat: BeatData) => void = () => {};

	// Provide a "start pos" BeatData
	let startPosBeat: BeatData = {
		id: 0,
		filled: false,
		pictographData: {
			// If you have a special “start pos” SVG or path, store it here:
			// e.g., grid: '/img/startpos.svg',
			// Or leave grid empty if you want a blank background
			grid: ''
		}
	};

	// We’ll pass our label down in a unique way shortly
</script>

<div class="start-pos-container">
	<!-- The old custom SVG in the background (or behind the Beat) -->
	<svg class="start-pos-svg" viewBox="0 0 100 100">
		<rect x="0" y="0" width="100" height="100" fill="#f0f0f0" />
		<text
			x="50%"
			y="50%"
			text-anchor="middle"
			alignment-baseline="middle"
			font-size="12"
			fill="#000"
		>
			{label}
		</text>
	</svg>

	<!-- The actual Beat, giving you consistent "beat" data + Pictograph functionality -->
	<Beat beat={startPosBeat} {onClick} />
</div>

<style>
	.start-pos-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.start-pos-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	/* Then Beat might also fill the container, potentially layering on top. */
</style>
