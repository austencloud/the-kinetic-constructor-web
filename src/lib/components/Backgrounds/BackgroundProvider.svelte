<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { setBackgroundContext } from './contexts/BackgroundContext';
	import { setRunesBackgroundContext } from './contexts/BackgroundContext.svelte';
	import type { BackgroundType, QualityLevel } from './types/types';
	import { browser } from '$app/environment';

	const props = $props<{
		backgroundType?: BackgroundType;
		initialQuality?: QualityLevel | undefined;
		isLoading?: boolean;
		children?: any;
	}>();

	let backgroundType = $state(props.backgroundType || 'snowfall');
	let initialQuality = $state(props.initialQuality);
	let isLoading = $state(props.isLoading || false);
	let isMounted = $state(false);

	$effect(() => {
		if (props.backgroundType !== undefined) {
			backgroundType = props.backgroundType;
		}
		if (props.initialQuality !== undefined) {
			initialQuality = props.initialQuality;
		}
		if (props.isLoading !== undefined) {
			isLoading = props.isLoading;
		}
	});

	let backgroundContext = $state<ReturnType<typeof setBackgroundContext> | null>(null);
	let runesContext = $state<ReturnType<typeof setRunesBackgroundContext> | null>(null);
	let contextsInitialized = $state(false);

	// Initialize contexts only once using onMount to ensure it runs after component initialization
	onMount(() => {
		if (browser && !contextsInitialized) {
			console.log('Setting up background contexts');
			// Set up the runes context first
			const runesCtx = setRunesBackgroundContext();
			runesContext = runesCtx; // Store for potential future use
			// Then set up the store-based context (which will use the runes context)
			backgroundContext = setBackgroundContext();
			contextsInitialized = true;

			// Export the runes context for debugging
			if (typeof window !== 'undefined') {
				(window as any).__runesBackgroundContext = runesCtx;
			}
		}
	});

	// Use a flag to prevent circular updates
	let isUpdatingFromContext = $state(false);

	// Helper function to create a string key for comparison
	function getBackgroundTypeKey(type: BackgroundType | null): string {
		return type || 'none';
	}

	// Track current values as string keys
	let currentBackgroundTypeKey = $state<string>('');
	let currentIsLoadingKey = $state<string>('');

	$effect(() => {
		if (!browser) return;
		if (!backgroundContext) return;
		if (isUpdatingFromContext) return; // Skip if we're updating from the context

		// Create a key for the current background type
		const newKey = getBackgroundTypeKey(backgroundType);

		// Skip if the background type hasn't changed
		if (newKey === currentBackgroundTypeKey) return;

		// Update the current key
		currentBackgroundTypeKey = newKey;

		console.log(`Provider setting background type: ${backgroundType}`);

		if (backgroundType) {
			// Set the flag to prevent circular updates
			isUpdatingFromContext = true;
			try {
				backgroundContext.setBackgroundType(backgroundType);
			} finally {
				// Reset the flag immediately - no timeout needed
				isUpdatingFromContext = false;
			}
		}
	});

	$effect(() => {
		if (!browser) return;
		if (!backgroundContext) return;
		if (isUpdatingFromContext) return; // Skip if we're updating from the context

		// Create a key for the current loading state
		const newKey = String(isLoading);

		// Skip if the loading state hasn't changed
		if (newKey === currentIsLoadingKey) return;

		// Update the current key
		currentIsLoadingKey = newKey;

		console.log(`Provider setting loading: ${isLoading}`);

		// Set the flag to prevent circular updates
		isUpdatingFromContext = true;
		try {
			backgroundContext.setLoading(isLoading);
		} finally {
			// Reset the flag immediately - no timeout needed
			isUpdatingFromContext = false;
		}
	});

	function handleBackgroundChange(event: CustomEvent) {
		if (!browser || !backgroundContext) return;

		if (event.detail && typeof event.detail === 'string') {
			const newBackgroundType = event.detail as BackgroundType;

			if (backgroundType !== newBackgroundType) {
				backgroundType = newBackgroundType;
				backgroundContext.setBackgroundType(newBackgroundType);
			}
		}
	}

	onMount(() => {
		isMounted = true;

		if (!browser) {
			return;
		}

		if (!backgroundContext) {
			console.error('No background context available!');
			return;
		}

		if (initialQuality) {
			backgroundContext.setQuality(initialQuality);
		}

		window.addEventListener('changeBackground', handleBackgroundChange as EventListener);
	});

	onDestroy(() => {
		if (!browser || !backgroundContext) return;

		window.removeEventListener('changeBackground', handleBackgroundChange as EventListener);
		backgroundContext.cleanup();
	});

	const derivedType = $derived(backgroundType);
	const derivedIsLoading = $derived(isLoading);

	export const background = {
		get type() {
			return derivedType;
		},
		get isLoading() {
			return derivedIsLoading;
		},
		setType: (type: BackgroundType) => {
			if (!browser || !backgroundContext) return;
			backgroundType = type;
			backgroundContext.setBackgroundType(type);
		},
		setLoading: (loading: boolean) => {
			if (!browser || !backgroundContext) return;
			isLoading = loading;
			backgroundContext.setLoading(loading);
		},
		setQuality: (quality: QualityLevel) => {
			if (!browser || !backgroundContext) return;
			backgroundContext.setQuality(quality);
		}
	};
</script>

{#if browser && isMounted}
	{@render props.children?.()}
{/if}
