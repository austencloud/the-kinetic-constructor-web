<script context="module" lang="ts">
	export interface BeatData {
		id: number;
		filled: boolean;
		pictographData: any;
	}
</script>

<script lang="ts">
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';

	export let beat: BeatData;
	export let onClick: (beat: BeatData) => void;

	let localName = `Beat ${beat.id}`;
</script>

<!-- 
   Re-use Pictograph internally, passing along the needed props 
   plus any extra logic unique to "Beat".
-->
<Pictograph
	pictographData={beat.pictographData}
	isSelected={beat.filled}
	name={localName}
	onClick={() => onClick(beat)}
/>
