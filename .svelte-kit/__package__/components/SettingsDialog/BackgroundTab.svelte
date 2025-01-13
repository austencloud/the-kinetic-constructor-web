<script lang="ts">
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;

	const backgrounds = ['Default', 'Snowfall', 'Abstract', 'Night Sky'];

	const selectBackground = (event: Event): void => {
		const target = event.target as HTMLSelectElement;
		onChangeBackground(target.value);
	};
</script>

<div>
	<h3>Background Settings</h3>
	<select bind:value={background} on:change={selectBackground}>
		{#each backgrounds as bg}
			<option value={bg}>{bg}</option>
		{/each}
	</select>
</div>
