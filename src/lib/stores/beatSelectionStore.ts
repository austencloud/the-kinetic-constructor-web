import type { PictographData } from '$lib/types/PictographData.js';
import { writable } from 'svelte/store';

export const selectedStartPos = writable<PictographData | null>(null);
