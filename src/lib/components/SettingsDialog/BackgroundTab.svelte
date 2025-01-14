<script lang="ts">
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;

	const backgrounds = ['Default', 'Snowfall', 'Abstract', 'Night Sky'];

	const selectBackground = (event: Event): void => {
		const target = event.target as HTMLSelectElement;
		onChangeBackground(target.value);
	};
</script>

<div class="container">
	<div class="content">
		<h3>Background Settings</h3>
		<select bind:value={background} on:change={selectBackground}>
			{#each backgrounds as bg}
				<option value={bg}>{bg}</option>
			{/each}
		</select>
	</div>
</div>

<style>
	.container {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		height: 100vh;
		padding-top: 20px; /* Adjust this value as needed */
	}
	.content {
		text-align: center;
	}
</style>
