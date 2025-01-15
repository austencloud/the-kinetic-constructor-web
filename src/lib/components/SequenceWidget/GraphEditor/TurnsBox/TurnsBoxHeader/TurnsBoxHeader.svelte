<script lang="ts">
	import PropRotDirButton from './PropRotDirButton.svelte';
	import rotateCWIcon from './icons/clockwise.png';
	import rotateCCWIcon from './icons/counter_clockwise.png';

	export let color: string; // Color string like "blue" or "red"
	export let onCWClick: () => void;
	export let onCCWClick: () => void;
	export let isCWPressed: boolean = false;
	export let isCCWPressed: boolean = false;

	const iconPaths = {
		clockwise: rotateCWIcon,
		counterClockwise: rotateCCWIcon,
	};
</script>

<div class="turns-box-header">
	<PropRotDirButton
		icon={iconPaths.counterClockwise}
		color={color}
		onClick={onCCWClick}
		isPressed={isCCWPressed}
	/>
	<span class="header-label">{color === 'blue' ? 'Left' : 'Right'}</span>
	<PropRotDirButton
		icon={iconPaths.clockwise}
		color={color}
		onClick={onCWClick}
		isPressed={isCWPressed}
	/>
</div>

<style>
	.turns-box-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 5px;
		border-bottom: 2px solid var(--color);
	}

	.header-label {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--color);
		transition: color 0.3s ease;
	}
</style>
