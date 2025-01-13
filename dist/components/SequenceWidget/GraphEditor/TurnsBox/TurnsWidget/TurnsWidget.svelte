<script>
	import TurnsTextLabel from './TurnsTextLabel.svelte';
	import TurnsDisplayFrame from './TurnsDisplayFrame.svelte';
	import MotionTypeLabel from './MotionTypeLabel.svelte';

	export let color; // Prop for passing color
</script>

<div class="turns-widget">
	<TurnsTextLabel />
	<TurnsDisplayFrame {color} />
	<MotionTypeLabel />
</div>

<style>
	.turns-widget {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 10px;
		padding: 10px;
		flex: 1;
	}
</style>
