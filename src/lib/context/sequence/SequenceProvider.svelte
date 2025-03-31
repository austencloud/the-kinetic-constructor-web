<!-- src/lib/context/sequence/SequenceProvider.svelte -->
<script lang="ts">
	import { createSequenceContext, type SequenceState } from './sequenceContext';
	import { onMount, onDestroy } from 'svelte';

	// Props
	export let initialData: Partial<SequenceState> | undefined = undefined;

	// Create the context
	const sequenceContext = createSequenceContext();
	const { state, dispatch } = sequenceContext;

	// Initialize with props data if provided
	onMount(() => {
		if (initialData) {
			// Update each property individually for type safety
			if (initialData.sequenceName) {
				dispatch({ type: 'SET_SEQUENCE_NAME', payload: initialData.sequenceName });
			}

			if (initialData.difficultyLevel) {
				dispatch({ type: 'SET_DIFFICULTY', payload: initialData.difficultyLevel });
			}

			if (initialData.startPosition) {
				dispatch({ type: 'SET_START_POSITION', payload: initialData.startPosition });
			}

			// Add any beats
			if (initialData.beats && Array.isArray(initialData.beats)) {
				initialData.beats.forEach((beat) => {
					dispatch({ type: 'ADD_BEAT', payload: beat });
				});
			}
		}
	});

	// Optional: add persistence capability
	// This could save to localStorage whenever the state changes
	/*
    const unsubscribe = state.subscribe($state => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sequence-state', JSON.stringify($state));
      }
    });
    
    onDestroy(() => {
      unsubscribe();
    });
    */
</script>

<slot></slot>
