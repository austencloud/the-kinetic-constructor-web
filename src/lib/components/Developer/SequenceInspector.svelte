<!-- src/lib/components/DevTools/SequenceInspector.svelte -->
<script lang="ts">
	import { getBeats, beatsStore } from '$lib/stores/sequence/beatsStore';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let visible = false;
	let jsonText = '';
	const error = writable('');

	function toggleInspector() {
		visible = !visible;
		if (visible) {
			jsonText = JSON.stringify(getBeats(), null, 2);
		}
	}

	function handleSave() {
		try {
			const updated = JSON.parse(jsonText);
			beatsStore.set(updated);
			error.set('');
		} catch (e) {
			error.set('Invalid JSON: ' + (e as Error).message);
		}
	}
</script>

<!-- Toggle Button -->
<button class="dev-tab-button" on:click={toggleInspector}> 🧪 Sequence JSON </button>

<!-- Inspector UI -->
{#if visible}
	<div class="json-flyout">
		<div class="header">
			<h3>Sequence Inspector</h3>
			<button class="close" on:click={() => (visible = false)}>✖</button>
		</div>
		<textarea bind:value={jsonText}></textarea>
		<button on:click={handleSave}>Save</button>
		{#if $error}<p class="error">{$error}</p>{/if}
	</div>
{/if}

<style>
	.dev-tab-button {
		position: absolute;
		right: 1rem;
		top: 1rem;
		z-index: 1100;
		background: #3a7bd5;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		cursor: pointer;
		font-weight: bold;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	.json-flyout {
		position: absolute;
		top: 60px;
		right: 10px;
		background: white;
		border: 1px solid #ccc;
		padding: 1rem;
		width: 400px;
		height: 500px;
		z-index: 1090;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
		display: flex;
		flex-direction: column;
	}

	.json-flyout .header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.json-flyout .header h3 {
		margin: 0;
	}

	.json-flyout .close {
		background: transparent;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
	}

	textarea {
		flex: 1;
		width: 100%;
		font-family: monospace;
		font-size: 0.85rem;
		resize: none;
		margin-bottom: 10px;
	}

	button {
		align-self: flex-start;
		background: #3a7bd5;
		color: white;
		border: none;
		padding: 6px 12px;
		border-radius: 4px;
		cursor: pointer;
	}

	.error {
		color: red;
		margin-top: 8px;
		font-size: 0.9rem;
	}
</style>
