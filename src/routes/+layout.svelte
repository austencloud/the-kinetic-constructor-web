<script lang="ts">
	import { onMount } from 'svelte';
	// LayoutData is automatically generated by SvelteKit based on your load functions
	import type { LayoutData } from './$types';
	// Import the function that processes the data and sets the store
	import { initializePictographData } from '$lib/stores/pictograph/pictographStore';
	// Import browser check if needed for other logic, but onMount is client-side only
	import { browser } from '$app/environment';
	// PWA registration temporarily disabled
	// import '$lib/pwa';
	// Import ServiceProvider for DI
	import ServiceProvider from '$lib/providers/ServiceProvider.svelte';
	// Import ModernServiceProvider for modern components
	import ModernServiceProvider from '$lib/providers/ModernServiceProvider.svelte';
	// Import ToastManager for notifications
	import ToastManager from '$lib/components/shared/ToastManager.svelte';
	// Import dev tools initializers
	// Import safe area CSS
	import '$lib/styles/safe-area.css';

	let { data, children }: { data: LayoutData; children: any } = $props();

	let initialized = false; // Flag to prevent running initialization multiple times

	// onMount runs only in the browser after the component has mounted
	onMount(() => {
		if (initialized || !browser) return; // Ensure runs only once in browser

		// Initialize dev tools in development mode

		// Check if the load function returned data successfully
		if (data?.csvData && !data.error) {
			try {
				initializePictographData(data.csvData);
				initialized = true; // Mark as initialized
			} catch (initError) {
				console.error('Layout onMount: Error calling initializePictographData:', initError);
				// Optionally display an error message to the user here
			}
		} else if (data?.error) {
			// Handle the case where the load function itself returned an error
			console.error('Layout onMount: Error received from load function:', data.error);
			initialized = true; // Mark as initialized to prevent retries
			// Optionally display an error message to the user here
		} else {
			// Handle the case where data is unexpectedly missing without an error
			console.warn('Layout onMount: No CSV data or error found in props.');
			initialized = true; // Mark as initialized
		}
	});
</script>

{#if data.error}
	<div class="layout-load-error">
		<h1>Application Initialization Error</h1>
		<p>Could not load essential data: {data.error}</p>
		<p>Please try refreshing the page.</p>
		{#if browser}
			<button onclick={() => window.location.reload()}>Refresh</button>
		{/if}
	</div>
{:else}
	<ServiceProvider>
		<ModernServiceProvider>
			{@render children()}
		</ModernServiceProvider>
	</ServiceProvider>
{/if}

<!-- Toast Manager for notifications -->
<ToastManager />

<style>
	/* Optional: Basic styling for the error message */
	.layout-load-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
		padding: 2rem;
		margin: 1rem;
		border: 1px solid #f56565; /* red-500 */
		background-color: #fed7d7; /* red-200 */
		color: #c53030; /* red-700 */
		border-radius: 0.375rem; /* rounded-md */
		text-align: center;
	}

	.layout-load-error h1 {
		font-size: 1.5rem; /* text-2xl */
		margin-bottom: 0.5rem; /* mb-2 */
	}

	.layout-load-error button {
		margin-top: 1rem; /* mt-4 */
		padding: 0.5rem 1rem; /* py-2 px-4 */
		border: 1px solid transparent;
		border-radius: 0.375rem; /* rounded-md */
		background-color: #e53e3e; /* red-600 */
		color: white;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.layout-load-error button:hover {
		background-color: #c53030; /* red-700 */
	}

	/* Ensure your layout takes up space if needed */
	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
	}

	/* If your app structure needs the layout to fill height */
	/* You might need a wrapper div depending on your CSS */
	/* For example:
    .layout-wrapper {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }
    .layout-wrapper > :global(main) { // Assuming your slot renders into a main tag
        flex-grow: 1;
    }
    */
</style>
