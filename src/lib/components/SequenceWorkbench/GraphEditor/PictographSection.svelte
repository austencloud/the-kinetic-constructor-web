<!-- src/lib/components/SequenceWorkbench/GraphEditor/PictographSection.svelte -->
<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		pictographData: PictographData;
		isStartPosition: boolean;
	}>();
</script>

<Pictograph pictographData={props.pictographData} isStartPosition={props.isStartPosition} />
