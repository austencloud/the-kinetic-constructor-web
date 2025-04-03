<script lang="ts">
	import { getBeats, beatsStore } from '$lib/stores/sequence/beatsStore';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { get } from 'svelte/store';

	let visible = false;
	let jsonText = '';
	const error = writable('');

	function formatBeatForExport(beat: any) {
		return {
			beat: beat.beatNumber,
			letter: beat.pictographData.letter ?? undefined,
			sequence_start_position: beat.beatNumber === 0 ? beat.pictographData.startPos?.replace(/\d+/g, '') : undefined,
			end_pos: beat.pictographData.endPos,
			timing: beat.pictographData.timing,
			direction: beat.pictographData.direction,
			blue_attributes: {
				start_loc: beat.pictographData.blueMotionData?.startLoc,
				end_loc: beat.pictographData.blueMotionData?.endLoc,
				start_ori: beat.pictographData.blueMotionData?.startOri,
				end_ori: beat.pictographData.blueMotionData?.endOri,
				prop_rot_dir: beat.pictographData.blueMotionData?.propRotDir,
				turns: beat.pictographData.blueMotionData?.turns,
				motion_type: beat.pictographData.blueMotionData?.motionType
			},
			red_attributes: {
				start_loc: beat.pictographData.redMotionData?.startLoc,
				end_loc: beat.pictographData.redMotionData?.endLoc,
				start_ori: beat.pictographData.redMotionData?.startOri,
				end_ori: beat.pictographData.redMotionData?.endOri,
				prop_rot_dir: beat.pictographData.redMotionData?.propRotDir,
				turns: beat.pictographData.redMotionData?.turns,
				motion_type: beat.pictographData.redMotionData?.motionType
			}
		};
	}

	function formatSequence() {
		const beats = getBeats();
		const metadata = {
			word: '',
			author: 'Austen Cloud',
			level: 0,
			prop_type: 'staff',
			grid_mode: 'diamond',
			is_circular: false,
			can_be_CAP: false,
			is_strict_rotated_CAP: false,
			is_strict_mirrored_CAP: false,
			is_strict_swapped_CAP: false,
			is_mirrored_swapped_CAP: false,
			is_rotated_swapped_CAP: false
		};
		return [metadata, ...beats.map(formatBeatForExport)];
	}

	function toggleInspector() {
		visible = !visible;
		if (visible) {
			jsonText = JSON.stringify(formatSequence(), null, 2);
		}
	}

	function handleSave() {
		try {
			const updated = JSON.parse(jsonText);
			// NOTE: Doesn't rehydrate BeatData properly, just replaces store with raw JSON structure.
			beatsStore.set(updated.slice(1));
			error.set('');
		} catch (e) {
			error.set('Invalid JSON: ' + (e as Error).message);
		}
	}
</script>

<!-- Toggle Button -->
<button class="dev-tab-button" on:click={toggleInspector}> 🧪 JSON </button>

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
