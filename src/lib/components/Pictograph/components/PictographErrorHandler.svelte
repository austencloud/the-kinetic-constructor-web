<!-- src/lib/components/Pictograph/components/PictographErrorHandler.svelte -->
<script lang="ts">
	import { untrack } from 'svelte';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		onError?: (error: { message: string; component: string }) => void;
		onStateChange: (state: string) => void;
		onErrorMessageChange: (message: string | null) => void;
	}>();

	// Error handling with protection against reactivity loops
	function handleError(source: string, error: any) {
		// Use untrack to prevent reactivity loops
		untrack(() => {
			const message = error instanceof Error ? error.message : String(error);

			// Update state via parent
			props.onErrorMessageChange(message);
			props.onStateChange('error');

			// Use setTimeout to break the reactivity chain for callbacks
			setTimeout(() => {
				// Notify parent component
				if (props.onError) {
					props.onError({ message, component: source });
				}
			}, 50);
		});
	}

	// Component error handling with protection against reactivity loops
	function handleComponentError(
		component: string,
		error: string | { message: string; component?: string; color?: string }
	) {
		// Use untrack to prevent reactivity loops
		untrack(() => {
			// Use setTimeout to break the reactivity chain
			setTimeout(() => {
				if (typeof error === 'string') {
					handleError(component, error);
				} else {
					handleError(component, error.message);
				}
			}, 10);
		});
	}

	// Export methods to make them available to parent component
	export { handleError, handleComponentError };
</script>

<!-- This component doesn't render anything, it just handles errors -->
