/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use sequenceStore from '$lib/state/stores/sequence/sequenceAdapter' instead.
 */

import { sequenceStore } from '$lib/state/stores/sequence/sequenceAdapter';
import { derived, writable } from 'svelte/store';

// Create a derived store to check if sequence is empty
export const isSequenceEmpty = derived(
  sequenceStore,
  ($sequenceStore) => $sequenceStore.beats.length === 0
);
