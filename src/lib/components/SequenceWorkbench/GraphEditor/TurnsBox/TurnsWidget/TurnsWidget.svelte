<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/TurnsWidget/TurnsWidget.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import TurnsTextLabel from './TurnsTextLabel.svelte';
	import TurnsDisplayFrame from './TurnsDisplayFrame.svelte';
	import MotionTypeLabel from './MotionTypeLabel.svelte';
  
	export let color: 'blue' | 'red';
	export let onOpenDialog: () => void;

	let elementWidth = 0;
	let widgetElement: HTMLElement;

	// Use ResizeObserver via an action
	function resizeObserver(node: HTMLElement) {
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				elementWidth = entry.contentRect.width;
			}
		});
		
		observer.observe(node);
		
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>
  
<div class="turns-widget" bind:this={widgetElement} use:resizeObserver>
	<TurnsTextLabel width={elementWidth} />
	<TurnsDisplayFrame {color} {onOpenDialog} width={elementWidth} />
	<MotionTypeLabel width={elementWidth} />
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