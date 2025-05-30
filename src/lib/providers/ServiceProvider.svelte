<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { getContainer } from '$lib/core/di/ContainerProvider';
	import { setServiceContainer } from '$lib/core/di/serviceContext';
	import { registerServices } from '$lib/core/di/registerServices';
	import { initializeStateManagement } from '$lib/state';
	import { browser } from '$app/environment';
	import SettingsManager from '$lib/components/SettingsManager/SettingsManager.svelte';
	import EffectsInitializer from './EffectsInitializer.svelte';

	// Props
	let {
		children
	}: {
		children?: import('svelte').Snippet;
	} = $props();

	// State tracking with better guards
	let isStateInitialized = $state(false);
	let isInitializing = $state(false);
	let hasAttemptedInit = $state(false); // NEW: Prevent multiple attempts

	// CRITICAL FIX: Initialize DI container during component initialization (synchronous)
	const container = getContainer();
	registerServices(container);
	setServiceContainer(container);

	async function initializeState() {
		// CRITICAL: Enhanced guards to prevent any double initialization
		if (isStateInitialized || isInitializing || !browser || hasAttemptedInit) return;

		console.log('🔧 ServiceProvider: Starting state initialization...');
		isInitializing = true;
		hasAttemptedInit = true;

		try {
			// Add delay at the start to let other components settle
			await new Promise((resolve) => setTimeout(resolve, 150));

			// MIGRATED: XState imports removed - using pure Svelte 5 runes now
			// No need to import state machines anymore

			// Import and handle sequence container safely
			const { sequenceContainer } = await import(
				'$lib/state/stores/sequence/SequenceContainer.svelte'
			);

			// Use untrack to prevent reactive cascades during initialization
			untrack(() => {
				try {
					sequenceContainer.loadFromLocalStorage();
				} catch (error) {
					console.error('ServiceProvider: Error loading sequence:', error);
				}
			});

			// CRITICAL: Add substantial delay before state management initialization
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Initialize state management in untracked context
			untrack(() => {
				initializeStateManagement();
			});

			isStateInitialized = true;
			console.log('✅ ServiceProvider: State initialization completed successfully');
		} catch (error) {
			console.error('Error initializing state management:', error);
			hasAttemptedInit = false; // Allow retry on error
		} finally {
			isInitializing = false;
		}
	}

	// CRITICAL: Only initialize in onMount, with better guards
	onMount(async () => {
		if (!isStateInitialized && browser && !isInitializing && !hasAttemptedInit) {
			// FIXED: Remove setTimeout to prevent reactive loops
			// Initialize immediately in onMount to avoid delayed reactive updates
			await initializeState();
		}
	});
</script>

{#if isStateInitialized || !browser}
	<!-- Include the SettingsManager component to handle settings lifecycle -->
	<SettingsManager />
	<!-- NUCLEAR TEST: Temporarily disable EffectsInitializer to test if it causes infinite loops -->
	<!-- <EffectsInitializer /> -->
	<!-- <div style="display: none;">🧪 NUCLEAR TEST: EffectsInitializer disabled</div> -->
	{#if children}
		{@render children()}
	{/if}
{:else}
	<div class="loading">Initializing application...</div>
{/if}

<style>
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		width: 100vw;
		background-color: rgb(11, 29, 42);
		color: white;
		font-size: 1.5rem;
	}
</style>
