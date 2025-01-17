<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import pictographDataStore from '$lib/stores/pictographDataStore';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import StartPositionLabel from './StartPosLabel.svelte';

	export const selectedStartPos = writable<Record<string, any> | null>(null);

	let startPositions: Record<string, any>[] = [];
	let gridMode = 'diamond';

	const containerWidth = writable<number>(0);

	pictographDataStore.subscribe((data) => {
		if (!Array.isArray(data)) {
			console.error('Invalid pictograph data:', data);
			return;
		}
		const defaultStartPosKeys =
			gridMode === 'diamond'
				? ['alpha1_alpha1', 'beta5_beta5', 'gamma11_gamma11']
				: ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];

		startPositions = data.filter((entry) =>
			defaultStartPosKeys.includes(`${entry.start_pos}_${entry.end_pos}`)
		);
		console.log('Filtered start positions:', startPositions);
	});

	const handleSelect = (position: Record<string, any>) => {
		selectedStartPos.set(position);
	};

	let container: HTMLDivElement;
	const updateWidth = () => {
		if (container) {
			containerWidth.set(container.clientWidth);
		}
	};

	onMount(() => {
		updateWidth();
		window.addEventListener('resize', updateWidth);
		return () => {
			window.removeEventListener('resize', updateWidth);
		};
	});
</script>

<div class="start-pos-picker">
	<StartPositionLabel />
	<div class="pictograph-container" bind:this={container}>
		{#if startPositions.length > 0}
			{#each startPositions as position}
				<Pictograph
					pictographData={position}
					onClick={() => handleSelect(position)}
					isSelected={$selectedStartPos?.id === position.id}
					name={position.name}
					interactive={true}
				/>
			{/each}
		{:else}
			<p>No start positions available.</p>
		{/if}
	</div>
</div>

<style>
	.start-pos-picker {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		margin-bottom: 5%;
	}

	.pictograph-container {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		width: 70%;
		height: auto;
		gap: 3%;
	}
</style>
