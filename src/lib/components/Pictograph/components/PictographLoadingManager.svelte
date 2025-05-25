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

	function handleGridLoaded(_data: GridData) {
		try {
			if (isProcessingGrid) {
				return;
			}

			isProcessingGrid = true;

			if (!loadedComponents.has('grid')) {
				loadedComponents.add('grid');
				componentsLoaded++;
			}

			// For start position pictographs (disableAnimations = true), eliminate delays
			const delay = props.disableAnimations ? 0 : 100;
			const componentDelay = props.disableAnimations ? 0 : 50;

			setTimeout(() => {
				try {
					const localState = props.onStateChange ? 'loading' : 'complete';
					const localPictographData = props.pictographData;

					if (localState === 'loading' && localPictographData) {
						setTimeout(() => {
							props.onCreateAndPositionComponents();
						}, componentDelay);
					}
				} catch (callbackError) {
					// Error handled silently
				} finally {
					isProcessingGrid = false;
				}
			}, delay);
		} catch (error) {
			isProcessingGrid = false;
			throw error;
		}
	}

	function handleComponentLoaded(component: string) {
		untrack(() => {
			if (!loadedComponents.has(component)) {
				loadedComponents.add(component);

				// For start position pictographs (disableAnimations = true), eliminate delays
				const delay = props.disableAnimations ? 0 : 100;
				const callbackDelay = props.disableAnimations ? 0 : 200;

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
								}, callbackDelay);
							}
						}
					});
				}, delay);
			}
		});
	}

	function handleGlyphLoaded(_event: CustomEvent<boolean>) {
		untrack(() => {
			// For start position pictographs (disableAnimations = true), eliminate delays
			const delay = props.disableAnimations ? 0 : 100;
			const callbackDelay = props.disableAnimations ? 0 : 200;

			setTimeout(() => {
				untrack(() => {
					props.onShowPictograph(true);
					props.onStateChange('complete');

					if (props.onLoaded) {
						setTimeout(() => {
							props.onLoaded?.({ error: false });
						}, callbackDelay);
					}
				});
			}, delay);
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
