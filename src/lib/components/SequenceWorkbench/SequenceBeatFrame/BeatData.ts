import type { Writable } from 'svelte/store';
import type { PictographData } from "$lib/types/PictographData.js";

export interface BeatData {
	beatNumber: number;
	filled: boolean;
	pictographData: PictographData; // ✅ Store as plain object, not a writable
	duration?: number; // Optional duration (default: 1)
}
