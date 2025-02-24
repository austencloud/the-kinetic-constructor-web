import { writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData.js';

// Store for the selected start position
export const selectedStartPos = writable<PictographData | null>(null);

// Store for options based on the selected start position
export const optionPickerData = writable([]);
