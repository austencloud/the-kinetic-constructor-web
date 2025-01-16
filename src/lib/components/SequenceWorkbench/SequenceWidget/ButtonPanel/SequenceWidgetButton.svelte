<script lang="ts">
	export let icon;
	export let title;
	export let buttonSize;
	export let onClick;

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
		transform: {isClicked ? 'scale(0.9)' : isHovered ? 'scale(1.1)' : 'scale(1)'};
		box-shadow: {isClicked
			? 'inset 0px 2px 4px rgba(0, 0, 0, 0.2)'
			: '0px 2px 4px rgba(0, 0, 0, 0.1)'};"
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
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		border: 1px solid #ccc;
		cursor: pointer;
		box-sizing: border-box;
		padding: 0;
		transition: background-color 0.2s, transform 0.2s;
		transition-duration: 0.1s;
		
	}

	.button img {
		width: 70%;
		height: 70%;
		object-fit: contain;
	}
</style>
