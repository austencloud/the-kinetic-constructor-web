<script lang="ts">
	import { onMount } from 'svelte';
	import { getContainer } from '$lib/core/di/ContainerProvider';
	import { setServiceContainer } from '$lib/core/di/serviceContext';
	import { registerServices } from '$lib/core/di/registerServices';
	import { initializeStateManagement } from '$lib/state';
	// We don't need appSelectors here
	import { browser } from '$app/environment';

	// State to track if the state management is initialized
	let isStateInitialized = false;

	// Initialize state management immediately in the script
	if (browser) {
		// Initialize dependency injection
		const container = getContainer();
		registerServices(container);
		setServiceContainer(container);

		// Initialize state management
		initializeStateManagement();
		console.log('State management initialized');
		isStateInitialized = true;
	}

	onMount(() => {
		if (!isStateInitialized && browser) {
			// Initialize dependency injection
			const container = getContainer();
			registerServices(container);
			setServiceContainer(container);

			// Initialize state management
			initializeStateManagement();
			console.log('State management initialized in onMount');
			isStateInitialized = true;
		}
	});
</script>

{#if isStateInitialized || !browser}
	<slot></slot>
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
