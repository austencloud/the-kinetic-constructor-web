import { writable } from 'svelte/store';
import { defaultPictographData } from '$lib/components/Pictograph/constants/defaultPictographData.js';
import type { BeatData } from '$lib/components/SequenceWorkbench/SequenceBeatFrame/BeatData.js';

export const beatsStore = writable<BeatData[]>([]); // ✅ Start empty

export function addBeat() {
	beatsStore.update((beats) => {
		const newBeat: BeatData = {
			beatNumber: beats.length + 1,
			filled: false,
			pictographData: defaultPictographData
		};
		return [...beats, newBeat];
	});
}

export function deleteBeat(beatNumber: number) {
	beatsStore.update((beats) => {
		if (beats.length === 0) return beats;

		const updatedBeats = beats.filter((beat) => beat.beatNumber !== beatNumber);

		updatedBeats.forEach((beat, index) => {
			beat.beatNumber = index + 1;
		});

		return updatedBeats;
	});
}
