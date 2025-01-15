<script lang="ts">
	import PropRotDirButton from './PropRotDirButton.svelte';
	import rotateCWIcon from '/icons/clockwise.png';
	import rotateCCWIcon from '/icons/counter_clockwise.png';

	export let color: 'blue' | 'red';

	let isCWPressed = false;
	let isCCWPressed = false;

	// Handle button presses and update the state
	const handleCWClick = () => {
		isCWPressed = true;
		isCCWPressed = false;
	};

	const handleCCWClick = () => {
		isCWPressed = false;
		isCCWPressed = true;
	};

	const labelMap = {
		blue: { text: 'Left', color: '#6a79d1' },
		red: { text: 'Right', color: '#f26d6d' },
	};
	$: labelData = labelMap[color] || { text: '', color: '#000000' };

	const iconPaths = {
		clockwise: rotateCWIcon,
		counterClockwise: rotateCCWIcon,
	};
</script>

<div class="turns-box-header" style="--color: {labelData.color};">
	<PropRotDirButton
		icon={iconPaths.counterClockwise}
		color={color}
		onClick={handleCCWClick}
		isPressed={isCCWPressed}
	/>
	<div class="header-label" style="color: {labelData.color};">{labelData.text}</div>
	<PropRotDirButton
		icon={iconPaths.clockwise}
		color={color}
		onClick={handleCWClick}
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
		font-size: 1.8rem;
		font-weight: bold;
		color: var(--color);
		transition: color 0.3s ease;
	}
</style>
