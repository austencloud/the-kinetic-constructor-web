<script lang="ts">
    import { type Writable } from 'svelte/store';
    import Beat from './Beat.svelte';
    import type { BeatData } from './BeatData.js';

    export const label: string = 'Start';
    export let onClick: (beatData: BeatData) => void = () => {};
    export let startPosBeatDataStore: Writable<BeatData>; // ✅ Explicitly declare prop type
</script>


<div class="start-pos-beat">
	<Beat beatData={$startPosBeatDataStore} {onClick} />
</div>

<style>
	.start-pos-beat {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
