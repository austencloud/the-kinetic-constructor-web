import { writable } from 'svelte/store';

// Creating a placeholder beatsStore if it doesn't exist
// This should be replaced with the actual import path when known
interface Beat {
	beatNumber: number;
	[key: string]: any;
}

// Replace this with the actual import once the correct path is known
export const beatsStore = writable<Beat[]>([]);

export function deleteBeat(beatNumber: number) {
	beatsStore.update((beats: Beat[]) => {
		if (beats.length === 0) return beats;

		const updatedBeats = beats.filter((beat: Beat) => beat.beatNumber !== beatNumber);

		// Renumber beats
		updatedBeats.forEach((beat: Beat, index: number) => {
			beat.beatNumber = index + 1;
		});

		return updatedBeats;
	});
}
