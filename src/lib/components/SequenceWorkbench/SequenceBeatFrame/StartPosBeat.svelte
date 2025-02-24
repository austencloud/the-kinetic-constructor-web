<script context="module" lang="ts">
	import Beat from './Beat.svelte';
	import type { BeatData } from './BeatData.js';
</script>

<script lang="ts">
	export const label: string = 'Start';
	export let onClick: (beatData: BeatData) => void = () => {};
	export let beatData: BeatData;
</script>

<div class="start-pos-beat">
	<Beat {beatData} {onClick} />
</div>

<style>
	.start-pos-beat {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
