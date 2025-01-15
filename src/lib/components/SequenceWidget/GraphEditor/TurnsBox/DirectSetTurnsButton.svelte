<script lang="ts">
	// Define the prop types explicitly
	export let value: string;
	export let borderColor: string;
	export let onClick: () => void;
	export let size: string = '150px';

	let isHovered: boolean = false;
	let isActive: boolean = false;

	// Calculate the font size based on button size
	$: fontSize = `${parseFloat(size) * 0.5}px`;
</script>

<button
	class="button {isHovered ? 'hovered' : ''} {isActive ? 'active' : ''}"
	style="
    border: 4px solid {borderColor};
    width: {size};
    height: {size};
    font-size: {fontSize};
  "
	on:mouseenter={() => (isHovered = true)}
	on:mouseleave={() => (isHovered = false)}
	on:mousedown={() => (isActive = true)}
	on:mouseup={() => (isActive = false)}
	on:click={onClick}
>
	{value}
</button>

<style>
	.button {
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: white;
		cursor: pointer;
		font-weight: bold;
		transition:
			background-color 0.3s,
			transform 0.2s,
			box-shadow 0.2s;
	}

	.button.hovered {
		background-color: #e0e7ff;
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
		transform: scale(1.1);
	}

	.button.active {
		background-color: #c7d2fe;
		box-shadow: inset 0px 4px 8px rgba(0, 0, 0, 0.2);
	}
</style>
