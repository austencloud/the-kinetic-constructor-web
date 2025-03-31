<!-- src/lib/components/SequenceWorkbench/ButtonPanel/SequenceWidgetButton.svelte -->
<script lang="ts">
	// Define a clear type for button props
	interface ButtonProps {
		icon: string;
		title: string;
		buttonSize: number;
		onClick: () => void;
	}

	// Use the interface for export props
	export let icon: ButtonProps['icon'];
	export let title: ButtonProps['title'];
	export let buttonSize: ButtonProps['buttonSize'];
	export let onClick: ButtonProps['onClick'];

	// Use reactive statements for derived state
	$: buttonStyle = {
		width: `${buttonSize}px`,
		height: `${buttonSize}px`,
		aspectRatio: '1 / 1'
	};
</script>

<button
	class="button"
	style:width={buttonStyle.width}
	style:height={buttonStyle.height}
	style:aspect-ratio={buttonStyle.aspectRatio}
	on:click={onClick}
	{title}
>
	<img src={icon} alt={title} />
</button>

<style>
	.button {
		/* Base styles that never change */
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		border: 1px solid #ccc;
		cursor: pointer;
		box-sizing: border-box;
		padding: 0;
		transition: all 0.1s ease-out;
		background-color: white;
	}

	.button:hover {
		background-color: #f0f0f0;
		transform: scale(1.1);
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
	}

	.button:active {
		transform: scale(0.9);
		box-shadow: inset 0px 2px 4px rgba(0, 0, 0, 0.2);
	}

	.button img {
		width: 70%;
		height: 70%;
		object-fit: contain;
	}
</style>