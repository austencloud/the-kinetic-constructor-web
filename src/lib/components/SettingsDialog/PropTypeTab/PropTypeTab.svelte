<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import PropButton from './PropButton.svelte';

	// Props and their corresponding icon paths
	const props = [
		{ name: 'Staff', icon: 'images/props/staff.svg' },
		{ name: 'Club', icon: 'images/props/club.svg' },
		{ name: 'Fan', icon: 'images/props/fan.svg' },
		{ name: 'Triad', icon: 'images/props/triad.svg' },
		{ name: 'Minihoop', icon: 'images/props/minihoop.svg' },
		{ name: 'Buugeng', icon: 'images/props/buugeng.svg' }
	];

	const dispatch = createEventDispatcher();

	// Handle button click
	const handlePropClick = (propName: string) => {
		dispatch('propSelected', propName);
	};
</script>

<div class="prop-type-tab">
	<h2 class="header">Prop Type</h2>
	<div class="grid">
		{#each props as { name, icon }}
			<PropButton {name} {icon} on:click={() => handlePropClick(name)} />
		{/each}
	</div>
</div>

<style>
	.prop-type-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px;
		height: 100%; /* Ensure it takes up all available height */
	}

	.header {
		font-size: 1.5rem;
		font-weight: bold;
		text-align: center;
		margin-bottom: 20px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); /* Responsive columns */
		gap: 2vh;
		width: 100%;
		/* max-width: 600px; */
		height: 100%; /* Ensure it takes up available height */
		margin-top: 5vh;
	}
</style>
