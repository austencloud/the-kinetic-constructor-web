<!--
  State Debugger Content Component

  This component displays the current state of the application without its own UI container.
  It's designed to be embedded in the DeveloperTools panel.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { stateRegistry } from '$lib/state/core';
	import { get } from 'svelte/store';
	import type { AnyActorRef } from 'xstate';
	import type { Readable } from 'svelte/store';

	// State
	let containers: ReturnType<typeof stateRegistry.getAll> = [];
	let selectedContainer: string | null = null;
	let containerValues: Record<string, any> = {};
	let updateInterval: ReturnType<typeof setInterval> | null = null;

	// Update containers and their values
	function updateContainers() {
		containers = stateRegistry.getAll();

		// Update values for all containers
		containers.forEach((container) => {
			try {
				if (container.type === 'store') {
					// Use type assertion to handle store type
					const storeInstance = container.instance as Readable<any>;
					containerValues[container.id] = get(storeInstance);
				} else if (container.type === 'machine') {
					// Use type assertion for machine/actor type
					const actorInstance = container.instance as AnyActorRef;
					containerValues[container.id] = actorInstance.getSnapshot();
				}
			} catch (error) {
				containerValues[container.id] = `Error getting value: ${error}`;
			}
		});

		// If no container is selected, select the first one
		if (!selectedContainer && containers.length > 0) {
			selectedContainer = containers[0].id;
		}
	}

	// Format value for display
	function formatValue(value: any): string {
		try {
			return JSON.stringify(value, null, 2);
		} catch (error) {
			return `[Error formatting value: ${error}]`;
		}
	}

	// Get container type label
	function getTypeLabel(type: string): string {
		return type === 'machine' ? 'State Machine' : 'Store';
	}

	// Lifecycle
	onMount(() => {
		// Initial update
		updateContainers();

		// Set up interval to update values
		updateInterval = setInterval(updateContainers, 1000);
	});

	onDestroy(() => {
		// Clean up interval
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});

	// Reset state
	function resetState() {
		if (confirm('Are you sure you want to reset all state?')) {
			stateRegistry.clear();
			updateContainers();
		}
	}

	// Persist state
	function persistState() {
		stateRegistry.persistState();
		alert('State persisted to localStorage');
	}
</script>

<div class="state-debugger-content">
	<div class="actions">
		<button on:click={resetState} class="danger">Reset All</button>
		<button on:click={persistState}>Persist</button>
		<button on:click={updateContainers}>Refresh</button>
	</div>

	<div class="container-list">
		<h3>State Containers ({containers.length})</h3>
		<div class="container-items">
			{#each containers as container}
				<button
					class="container-item"
					class:selected={selectedContainer === container.id}
					on:click={() => (selectedContainer = container.id)}
				>
					<span class="container-name">{container.id}</span>
					<span class="container-type">{getTypeLabel(container.type)}</span>
					{#if container.persist}
						<span class="persist-badge">Persisted</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<div class="container-details">
		{#if selectedContainer}
			{#if containerValues[selectedContainer]}
				<h3>
					{selectedContainer}
					<span class="type-badge">
						{getTypeLabel(containers.find((c) => c.id === selectedContainer)?.type || 'unknown')}
					</span>
				</h3>
				<pre>{formatValue(containerValues[selectedContainer])}</pre>
			{:else}
				<p>No data available for this container.</p>
			{/if}
		{:else}
			<p>Select a container to view its state.</p>
		{/if}
	</div>
</div>

<style>
	.state-debugger-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		font-family: monospace;
		color: #e0e0e0;
	}

	.actions {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	.actions button {
		background: #2a2a2a;
		color: #e0e0e0;
		border: 1px solid #444;
		padding: 6px 12px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
		transition: background-color 0.2s;
	}

	.actions button:hover {
		background: #333;
	}

	.actions button.danger {
		background: #d32f2f;
		border-color: #d32f2f;
	}

	.actions button.danger:hover {
		background: #e33e3e;
	}

	.container-list {
		margin-bottom: 12px;
	}

	.container-list h3 {
		margin-top: 0;
		font-size: 14px;
		margin-bottom: 8px;
		color: #4da6ff;
		border-bottom: 1px solid #444;
		padding-bottom: 4px;
	}

	.container-items {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 12px;
	}

	.container-item {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #2a2a2a;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 4px 8px;
		cursor: pointer;
		font-size: 12px;
		color: inherit;
		transition: background-color 0.2s;
	}

	.container-item:hover {
		background: #333;
	}

	.container-item.selected {
		background: #4da6ff;
		border-color: #4da6ff;
		color: white;
	}

	.container-name {
		font-weight: bold;
	}

	.container-type {
		color: #aaa;
		font-size: 10px;
		background: #333;
		padding: 2px 4px;
		border-radius: 3px;
	}

	.persist-badge {
		font-size: 10px;
		background: #ffd700;
		color: #333;
		padding: 2px 4px;
		border-radius: 3px;
	}

	.container-details {
		flex-grow: 1;
		overflow-y: auto;
	}

	.container-details h3 {
		margin-top: 0;
		font-size: 16px;
		display: flex;
		align-items: center;
		gap: 8px;
		color: #4da6ff;
	}

	.type-badge {
		font-size: 10px;
		font-weight: normal;
		background: #333;
		color: #aaa;
		padding: 2px 4px;
		border-radius: 3px;
	}

	.container-details pre {
		background: #2a2a2a;
		padding: 12px;
		border-radius: 4px;
		overflow: auto;
		font-size: 12px;
		margin: 0;
		line-height: 1.5;
		max-height: 100%;
		border: 1px solid #444;
	}
</style>
