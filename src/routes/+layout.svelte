<script lang="ts">
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';
	import { pictographData } from '$lib/state/pictograph/pictographDataState.svelte';
	import { browser } from '$app/environment';
	import ServiceProvider from '$lib/providers/ServiceProvider.svelte';
	import ToastManager from '$lib/components/shared/ToastManager.svelte';
	import '$lib/styles/safe-area.css';

	let {
		data,
		children
	}: {
		data: LayoutData;
		children?: import('svelte').Snippet;
	} = $props();

	let initialized = $state(false);

	onMount(async () => {
		if (initialized || !browser) return;

		if (data?.csvData && !data.error) {
			try {
				await pictographData.initializeFromCsv(data.csvData);
				initialized = true;
			} catch (initError) {
				console.error('Layout onMount: Error initializing pictograph data:', initError);
			}
		} else if (data?.error) {
			console.error('Layout onMount: Error received from load function:', data.error);
			initialized = true;
		} else {
			console.warn('Layout onMount: No CSV data or error found in props.');
			initialized = true;
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
		{@render children?.()}
	</ServiceProvider>
{/if}

<ToastManager />

<style>
	.layout-load-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
		padding: 2rem;
		margin: 1rem;
		border: 1px solid #f56565;
		background-color: #fed7d7;
		color: #c53030;
		border-radius: 0.375rem;
		text-align: center;
	}

	.layout-load-error h1 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.layout-load-error button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background-color: #e53e3e;
		color: white;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.layout-load-error button:hover {
		background-color: #c53030;
	}

	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
	}
</style>
