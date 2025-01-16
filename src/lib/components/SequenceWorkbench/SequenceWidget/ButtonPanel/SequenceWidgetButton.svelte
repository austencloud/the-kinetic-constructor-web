<script lang="ts">
	export let icon: string;
	export let title: string;
	export let buttonSize: number = 50; // Default size
	export let onClick: () => void;

	let isHovered = false;
	let isClicked = false;

	const handleMouseEnter = () => (isHovered = true);
	const handleMouseLeave = () => (isHovered = false);
	const handleMouseDown = () => (isClicked = true);
	const handleMouseUp = () => (isClicked = false);
</script>

<button
	class="button"
	style="
		width: {buttonSize}px;
		height: {buttonSize}px;
		background-color: {isHovered ? '#f0f0f0' : 'white'};
		transform: {isClicked ? 'scale(0.9)' : isHovered ? 'scale(1.1)' : 'scale(1)'};"
	on:click={onClick}
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	on:mousedown={handleMouseDown}
	on:mouseup={handleMouseUp}
	{title}
>
	<img src={icon} alt={title} />
</button>

<style>
	.button {
		border-radius: 50%;
		border: 1px solid #ccc;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		aspect-ratio: 1 / 1; /* Always maintain circular shape */
		box-sizing: border-box;
	}

	.button img {
		width: 90%; /* Scale up closer to the full button size */
		height: 90%;
		object-fit: contain;
	}
</style>
