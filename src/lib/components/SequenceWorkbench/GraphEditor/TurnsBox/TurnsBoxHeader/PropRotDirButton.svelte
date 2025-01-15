<script lang="ts">
	export let icon: string;
	export let color: string;
	export let onClick: () => void;
	export let isPressed: boolean = false;

	// Map color strings to hex codes
	const colorHexMap: Record<string, string> = {
		blue: '#6a79d1',
		red: '#f26d6d',
	};

	// Fallback to default color if not found
	$: parsedColor = colorHexMap[color] || '#ffffff';
</script>

<button
	class="button"
	style="
		--color: {parsedColor};
		--background-color: {isPressed ? parsedColor : 'white'};
		--hover-background: {isPressed ? parsedColor : '#f5f5f5'};"
	on:click={onClick}
	aria-label="Prop Rotation Button"
	aria-pressed={isPressed}
>
	<img class="icon" src={icon} alt="Prop Rotation Icon" />
</button>

<style>
	/* Button Base Style */
	.button {
		width: 4rem;
		height: 4rem;
		border: 2px solid var(--color);
		border-radius: 10px; /* Slightly rounded corners for a modern look */
		background-color: var(--background-color);
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		transition:
			background-color 0.3s ease,
			transform 0.1s ease-in-out,
			box-shadow 0.3s ease;
		box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.2),
			inset 0px 1px 3px rgba(255, 255, 255, 0.5); /* Subtle inner shadow */
	}

	/* Hover Effect */
	.button:hover {
		background-color: var(--hover-background);
		box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3),
			inset 0px 1px 3px rgba(255, 255, 255, 0.5),
			0px 0px 5px rgba(255, 255, 255, 0.8); /* Glow effect */
		transform: scale(1.05); /* Slight scaling effect */
	}

	/* Pressed State */
	.button:active {
		background-color: var(--color);
		box-shadow: inset 0px 4px 6px rgba(0, 0, 0, 0.2),
			inset 0px 2px 4px rgba(255, 255, 255, 0.3);
		transform: translateY(2px); /* Slight downward movement */
	}
	
	/* Pressed state when toggled */
	.button[aria-pressed='true'] {
		background-color: var(--color);
		box-shadow: inset 0px 4px 6px rgba(0, 0, 0, 0.3),
		inset 0px 2px 4px rgba(255, 255, 255, 0.3);
		transform: translateY(2px);
		cursor: default; /* Disable pointer cursor when pressed */
	}

	/* Icon Style */
	.icon {
		width: 100%; /* Allow the icon to take up most of the button */
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
	}
</style>
