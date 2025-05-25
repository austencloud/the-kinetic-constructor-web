<!-- src/lib/components/Pictograph/components/PictographLoadingManager.svelte -->
<script lang="ts">
	import type { GridData } from '$lib/components/objects/Grid/GridData';
	import type { PictographService } from '../PictographService';
	import type { PictographData } from '$lib/types/PictographData';
	import { untrack } from 'svelte';

	const props = $props<{
		service: PictographService | null;
		pictographData?: PictographData;
		disableAnimations?: boolean;
		onLoaded?: (result: { error: boolean }) => void;
		onCreateAndPositionComponents: () => void;
		onShowPictograph: (show: boolean) => void;
		onStateChange: (state: string) => void;
	}>();

	let componentsLoaded = $state(0);
	let totalComponentsToLoad = $state(1);
	let loadedComponents = $state(new Set<string>());
	let requiredComponents = $state(['grid']);
	let isProcessingGrid = $state(false);

	function handleGridLoaded(data: GridData) {
		try {
			if (isProcessingGrid) {
				return;
			}

			isProcessingGrid = true;

			const localData = { ...data };

			if (!loadedComponents.has('grid')) {
				loadedComponents.add('grid');
				componentsLoaded++;
			}

			setTimeout(() => {
				try {
					const localState = props.onStateChange ? 'loading' : 'complete';
					const localPictographData = props.pictographData;

					if (localState === 'loading' && localPictographData) {
						setTimeout(() => {
							props.onCreateAndPositionComponents();
						}, 50);
					}
				} catch (callbackError) {
					// Error handling without console log
				} finally {
					isProcessingGrid = false;
				}
			}, 100);
		} catch (error) {
			isProcessingGrid = false;
			throw error;
		}
	}

	function handleComponentLoaded(component: string) {
		untrack(() => {
			if (!loadedComponents.has(component)) {
				loadedComponents.add(component);

				setTimeout(() => {
					untrack(() => {
						componentsLoaded++;

						const allLoaded = requiredComponents.every((comp) => loadedComponents.has(comp));

						if (allLoaded) {
							props.onShowPictograph(true);
							props.onStateChange('complete');

							if (props.onLoaded) {
								setTimeout(() => {
									props.onLoaded?.({ error: false });
								}, 200);
							}
						}
					});
				}, 100);
			}
		});
	}

	function handleGlyphLoaded(_event: CustomEvent<boolean>) {
		untrack(() => {
			setTimeout(() => {
				untrack(() => {
					props.onShowPictograph(true);
					props.onStateChange('complete');

					if (props.onLoaded) {
						setTimeout(() => {
							props.onLoaded?.({ error: false });
						}, 200);
					}
				});
			}, 100);
		});
	}

	function notifyLoaded(hasError: boolean) {
		untrack(() => {
			setTimeout(() => {
				if (props.onLoaded) {
					props.onLoaded?.({ error: hasError });
				}
			}, 50);
		});
	}

	function updateRequiredComponents(components: string[]) {
		requiredComponents = components;
	}

	function updateTotalComponentsToLoad(total: number) {
		totalComponentsToLoad = total;
	}

	function resetLoadingState() {
		componentsLoaded = 0;
		loadedComponents = new Set<string>();
		requiredComponents = ['grid'];
		totalComponentsToLoad = 1;
	}

	export {
		handleGridLoaded,
		handleComponentLoaded,
		handleGlyphLoaded,
		updateRequiredComponents,
		updateTotalComponentsToLoad,
		resetLoadingState
	};

	export function getLoadProgress() {
		return Math.floor((componentsLoaded / totalComponentsToLoad) * 100);
	}

	export function getComponentsLoaded() {
		return componentsLoaded;
	}

	export function getTotalComponentsToLoad() {
		return totalComponentsToLoad;
	}
</script>
