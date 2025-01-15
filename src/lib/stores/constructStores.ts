import { writable } from 'svelte/store';

// Store for the selected start position
export const selectedStartPos = writable(null);

// Store for options based on the selected start position
export const optionPickerData = writable([]);
