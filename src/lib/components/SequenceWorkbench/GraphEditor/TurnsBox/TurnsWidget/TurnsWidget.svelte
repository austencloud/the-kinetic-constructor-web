<script lang="ts">
	import { onMount } from 'svelte';
	import TurnsTextLabel from './TurnsTextLabel.svelte';
	import TurnsDisplayFrame from './TurnsDisplayFrame.svelte';
	import MotionTypeLabel from './MotionTypeLabel.svelte';
  
	export let color: 'blue' | 'red';
	export let turns: string | number;
	export let onOpenDialog: () => void;

	let width = 0;

	onMount(() => {
		const resizeObserver = new ResizeObserver(entries => {
			for (let entry of entries) {
				width = entry.contentRect.width;
			}
		});
		const element = document.querySelector('.turns-widget');
		if (element) {
			resizeObserver.observe(element);
		}
		return () => {
			if (element) {
				resizeObserver.unobserve(element);
			}
		};
	});
</script>
  
<div class="turns-widget">
	<TurnsTextLabel {width} />
	<TurnsDisplayFrame {color} {turns} {onOpenDialog} {width} />
	<MotionTypeLabel {width} />
</div>
  
<style>
	.turns-widget {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px;
		flex: 1;
		justify-content: space-evenly;
	}
</style>