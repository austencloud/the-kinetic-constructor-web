<script lang="ts">
	import { setContext } from 'svelte';
	import { getContainer } from '$lib/core/di/ContainerProvider';
	import { registerServices } from '$lib/core/di/registerServices';
	import { CONTAINER_KEY } from '$lib/core/di/serviceContext';
	import { initializeStateManagement } from '$lib/state';
	import { browser } from '$app/environment';
	import SettingsManager from '$lib/components/SettingsManager/SettingsManager.svelte';
	import type { Snippet } from 'svelte';

	// Props interface for Svelte 5 children
	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	let isStateInitialized = $state(false);
	let isInitializing = $state(false);
	let initializationError = $state<string | null>(null);

	// Create container synchronously and set context immediately
	const container = getContainer();
	registerServices(container);

	// Set context synchronously during component initialization
	setContext(CONTAINER_KEY, container);

	// Use $effect for async initialization with proper cleanup
	$effect(() => {
		if (!browser || isStateInitialized || isInitializing) return;

		// Async initialization function
		async function initializeState() {
			isInitializing = true;
			initializationError = null;

			try {
				console.log('🔧 ServiceProvider: Initializing state management...');

				// Add delay to prevent conflicts with ModernServiceProvider
				await new Promise((resolve) => setTimeout(resolve, 200));

				// Import state machines
				await import('$lib/state/machines/app/app.machine');
				await import('$lib/state/machines/sequenceMachine');

				const { sequenceContainer } = await import('$lib/state/stores/sequence/SequenceContainer');

				try {
					sequenceContainer.loadFromLocalStorage();
					console.log('✅ ServiceProvider: Loaded sequence from localStorage');
				} catch (error) {
					console.error('ServiceProvider: Error loading sequence from localStorage:', error);
				}

				// Initialize state management
				initializeStateManagement();
				isStateInitialized = true;

				console.log('✅ ServiceProvider: State management initialized successfully');
			} catch (error) {
				console.error('ServiceProvider: Error initializing state management:', error);
				initializationError =
					error instanceof Error ? error.message : 'Unknown initialization error';
			} finally {
				isInitializing = false;
			}
		}

		// Start initialization
		initializeState();
	});

	const showContent = $derived(isStateInitialized || !browser);

	// Retry function for error handling
	function retryInitialization() {
		initializationError = null;
		isStateInitialized = false;
		isInitializing = false;
		// The $effect will automatically re-run when isStateInitialized changes
	}
</script>

{#if initializationError}
	<div class="error">
		<h2>Initialization Error</h2>
		<p>{initializationError}</p>
		<button onclick={retryInitialization}>Retry</button>
		<button onclick={() => window.location.reload()}>Reload</button>
	</div>
{:else if showContent}
	<SettingsManager />
	{@render children?.()}
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

	.error {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
		width: 100vw;
		background-color: rgb(11, 29, 42);
		color: white;
		text-align: center;
		padding: 2rem;
	}

	.error h2 {
		color: #ff6b6b;
		margin-bottom: 1rem;
	}

	.error button {
		margin: 0.5rem;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		background: #007acc;
		color: white;
	}

	.error button:hover {
		background: #005a9e;
	}
</style>
