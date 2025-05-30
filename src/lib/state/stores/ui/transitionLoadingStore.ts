/**
 * Transition Loading Store - Svelte 5 Runes Implementation
 */

function createTransitionLoadingStore() {
	let isLoading = $state(false);

	return {
		get isLoading() { return isLoading; },
		
		setLoading(loading: boolean) {
			isLoading = loading;
		},
		
		subscribe(callback: (loading: boolean) => void) {
			// Simple subscription pattern
			const unsubscribe = () => {};
			callback(isLoading);
			return unsubscribe;
		}
	};
}

export const transitionLoadingStore = createTransitionLoadingStore();
