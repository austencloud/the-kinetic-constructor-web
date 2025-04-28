<!--
  State Debugger Component
  
  This component displays the current state of the application.
  It's useful for debugging and development.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { stateRegistry } from '$lib/state/core';
	import { get } from 'svelte/store';
	import type { AnyActorRef } from 'xstate';
	import type { Readable } from 'svelte/store';

	// Props
	export let open = false;

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

	// Toggle debugger
	function toggleDebugger() {
		open = !open;
	}

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

<div class="state-debugger" class:open>
	<button class="toggle-button" on:click={toggleDebugger}>
		{open ? 'Close' : 'Debug State'}
	</button>

	{#if open}
		<div class="debugger-content">
			<div class="header">
				<h2>State Debugger</h2>
				<div class="actions">
					<button on:click={resetState} class="danger">Reset All</button>
					<button on:click={persistState}>Persist</button>
					<button on:click={updateContainers}>Refresh</button>
				</div>
			</div>

			<div class="container-list">
				<h3>State Containers ({containers.length})</h3>
				<ul>
					{#each containers as container}
						<button
							class="container-item"
							class:selected={selectedContainer === container.id}
							on:click={() => (selectedContainer = container.id)}
							on:keydown={(e) => e.key === 'Enter' && (selectedContainer = container.id)}
						>
							<span class="container-name">{container.id}</span>
							<span class="container-type">{getTypeLabel(container.type)}</span>
							{#if container.persist}
								<span class="persist-badge">Persisted</span>
							{/if}
						</button>
					{/each}
				</ul>
			</div>

			<div class="container-details">
				{#if selectedContainer}
					{#if containerValues[selectedContainer]}
						<h3>
							{selectedContainer}
							<span class="type-badge">
								{getTypeLabel(
									containers.find((c) => c.id === selectedContainer)?.type || 'unknown'
								)}
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
	{/if}
</div>

<style>
	.state-debugger {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 9999;
		font-family: monospace;
	}

	.toggle-button {
		background: #333;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
	}

	.debugger-content {
		position: fixed;
		bottom: 60px;
		right: 20px;
		width: 80vw;
		max-width: 1200px;
		height: 80vh;
		background: #1e1e1e;
		color: #eee;
		border-radius: 8px;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.header {
		padding: 12px 16px;
		background: #333;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #555;
	}

	.header h2 {
		margin: 0;
		font-size: 18px;
	}

	.actions {
		display: flex;
		gap: 8px;
	}

	.actions button {
		background: #444;
		color: white;
		border: none;
		padding: 4px 8px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
	}

	.actions button.danger {
		background: #933;
	}

	.container-list {
		padding: 12px 16px;
		overflow-y: auto;
		flex-shrink: 0;
		max-height: 30%;
		border-bottom: 1px solid #555;
	}

	.container-list h3 {
		margin-top: 0;
		font-size: 14px;
		margin-bottom: 8px;
		color: #aaa;
	}

	.container-list ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
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

	.container-item.selected {
		background: #0066cc;
		border-color: #0077e6;
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
		background: #553;
		color: #ffd;
		padding: 2px 4px;
		border-radius: 3px;
	}

	.container-details {
		padding: 12px 16px;
		overflow-y: auto;
		flex-grow: 1;
	}

	.container-details h3 {
		margin-top: 0;
		font-size: 16px;
		display: flex;
		align-items: center;
		gap: 8px;
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
		background: #111;
		padding: 12px;
		border-radius: 4px;
		overflow: auto;
		font-size: 12px;
		margin: 0;
		line-height: 1.5;
		max-height: 100%;
	}
</style>
