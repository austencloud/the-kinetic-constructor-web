import { writable } from 'svelte/store';

// Shared store to manage the selected pictograph
export const selectedPictograph = writable(null);
