import type { PictographData } from "$lib/types/PictographData.js";

export interface BeatData {
	beatNumber: number;
	filled: boolean;
	pictographData: PictographData;
	duration?: number; // Optional duration (default: 1)
}
