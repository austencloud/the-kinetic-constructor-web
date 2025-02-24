import { writable } from 'svelte/store';
import { defaultPictographData } from '$lib/components/Pictograph/defaultPictographData.js';
import type { BeatData } from '$lib/components/SequenceWorkbench/SequenceBeatFrame/BeatData.js';

const initialBeats: BeatData[] = Array.from({ length: 16 }, (_, i) => ({
	beatNumber: i + 1,
	filled: false,
	pictographData: defaultPictographData
}));

export const beatsStore = writable<BeatData[]>(initialBeats);

export function addBeat(newBeat: BeatData) {
	beatsStore.update((beats) => {
		if (beats.length >= 64) {
			console.warn('Max beats reached (64)');
			return beats;
		}

		newBeat.beatNumber = beats.length + 1;
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
