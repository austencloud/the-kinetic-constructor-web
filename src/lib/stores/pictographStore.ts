import { writable } from 'svelte/store';

export const pictographDataStore = writable({
  grid: { points: [] },
  arrows: [],
  props: [],
});
