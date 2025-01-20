// src/stores/pictographRenderStore.ts
import { writable } from 'svelte/store';

export const pictographsRendered = writable(0); // Tracks how many pictographs are rendered
export const totalPictographs = writable(3); // Set to the total number of pictographs
