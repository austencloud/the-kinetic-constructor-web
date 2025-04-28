<!--
  Developer Tools Component

  A comprehensive developer tools panel that includes:
  - State debugging
  - Logging
  - Layout debugging

  Only shown in development mode.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import StateDebuggerContent from '$lib/components/Debug/StateDebuggerContent.svelte';
	import SequenceInspectorContent from './SequenceInspectorContent.svelte';
	import SimpleLogViewer from './SimpleLogViewer.svelte';
	import LayoutDebuggerContent from './LayoutDebuggerContent.svelte';
	import { writable } from 'svelte/store';

	// State
	const isOpen = writable(false);
	const activeTab = writable('state');

	// Reference to the dev tools container
	let devToolsElement: HTMLDivElement;

	// Click outside handler
	function handleClickOutside(event: MouseEvent) {
		if (
			$isOpen &&
			devToolsElement &&
			!devToolsElement.contains(event.target as Node) &&
			!(event.target as HTMLElement).classList.contains('toggle-button')
		) {
			$isOpen = false;
		}
	}

	// Set up and clean up click outside listener
	onMount(() => {
		document.addEventListener('mousedown', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('mousedown', handleClickOutside);
	});

	// Toggle panel
	function togglePanel() {
		$isOpen = !$isOpen;
	}

	// Set active tab
	function setActiveTab(tab: string) {
		$activeTab = tab;
	}
</script>

<div class="dev-tools" bind:this={devToolsElement}>
	<button class="toggle-button" on:click={togglePanel}> 🛠️ Dev Tools </button>

	{#if $isOpen}
		<div class="dev-tools-open" transition:fade={{ duration: 150 }}>
			<div class="header">
				<div class="tab-buttons">
					<button class:active={$activeTab === 'state'} on:click={() => setActiveTab('state')}>
						🔍 State
					</button>
					<button
						class:active={$activeTab === 'sequence'}
						on:click={() => setActiveTab('sequence')}
					>
						🧪 Sequence
					</button>
					<button class:active={$activeTab === 'logs'} on:click={() => setActiveTab('logs')}>
						📝 Logs
					</button>
					<button class:active={$activeTab === 'layout'} on:click={() => setActiveTab('layout')}>
						📐 Layout
					</button>
				</div>
				<button class="close-button" on:click={togglePanel}> ✕ </button>
			</div>

			<div class="panel">
				<div class="content">
					{#if $activeTab === 'state'}
						<StateDebuggerContent />
					{:else if $activeTab === 'sequence'}
						<SequenceInspectorContent />
					{:else if $activeTab === 'logs'}
						<SimpleLogViewer maxHeight="400px" />
					{:else if $activeTab === 'layout'}
						<LayoutDebuggerContent />
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.dev-tools {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 9999;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.dev-tools-open {
		background: #1e1e1e;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
		border: 1px solid #444;
		width: 800px;
		height: 600px;
		max-width: 90vw;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		margin-bottom: 10px;
		position: absolute;
		bottom: 100%;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px;
		background: #252525;
		border-top-left-radius: 8px;
		border-top-right-radius: 8px;
		border-bottom: 1px solid #444;
	}

	.toggle-button {
		background: #2a2a2a;
		color: #e0e0e0;
		border: 1px solid #444;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		transition: background-color 0.2s;
		position: relative;
		z-index: 1;
	}

	.toggle-button:hover {
		background: #333;
	}

	.tab-buttons {
		display: flex;
		overflow: hidden;
		border-radius: 4px;
		background: #2a2a2a;
		border: 1px solid #444;
	}

	.tab-buttons button {
		background: none;
		border: none;
		color: #e0e0e0;
		padding: 8px 16px;
		cursor: pointer;
		font-size: 14px;
		border-right: 1px solid #444;
		transition: background-color 0.2s;
	}

	.tab-buttons button:hover {
		background: #333;
	}

	.tab-buttons button:last-child {
		border-right: none;
	}

	.tab-buttons button.active {
		background: #4da6ff;
		color: #fff;
		font-weight: bold;
	}

	.close-button {
		background: #d32f2f;
		color: white;
		border: none;
		border-radius: 4px;
		width: 30px;
		height: 30px;
		font-size: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.close-button:hover {
		background: #e33e3e;
	}

	.panel {
		background: #1e1e1e;
		overflow: hidden;
		flex: 1;
		height: calc(100% - 50px);
		color: #e0e0e0;
	}

	.content {
		padding: 16px;
		height: 100%;
		overflow: auto;
		box-sizing: border-box;
	}
</style>
