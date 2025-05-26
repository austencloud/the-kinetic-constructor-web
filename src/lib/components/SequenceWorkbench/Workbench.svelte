<script lang="ts">
	import SequenceWidget from './SequenceWidget.svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver.svelte';

	const { resizeObserver } = useResizeObserver();
</script>

{#key undefined}
	<div class="sequence-workbench" use:resizeObserver>
		<SequenceWidget />
	</div>
{/key}

<style>
	.sequence-workbench {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
</style>
