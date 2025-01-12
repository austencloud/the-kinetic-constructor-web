<script lang="ts">
	import PropRotDirButton from './PropRotDirButton.svelte';
	import rotateCWIcon from './icons/clockwise.png';
	import rotateCCWIcon from './icons/counter_clockwise.png';

	export let color: string;
	export let onCWClick: () => void;
	export let onCCWClick: () => void;
	export let isCWPressed: boolean = false;
	export let isCCWPressed: boolean = false;

	const iconPaths = {
		clockwise: rotateCWIcon,
		counterClockwise: rotateCCWIcon
	};
</script>

<div
	class="container"
	style="--border-color: {color === 'blue' ? '#2e3192' : '#ed1c24'}; --text-color: {color === 'blue'
		? '#2e3192'
		: '#ed1c24'}"
>
	<PropRotDirButton
		icon={iconPaths.counterClockwise}
		color={color === 'blue' ? '#2e3192' : '#ed1c24'}
		onClick={onCCWClick}
		isPressed={isCCWPressed}
	/>
	<span class="header-label">{color === 'blue' ? 'Left' : 'Right'}</span>
	<PropRotDirButton
		icon={iconPaths.clockwise}
		color={color === 'blue' ? '#2e3192' : '#ed1c24'}
		onClick={onCWClick}
		isPressed={isCWPressed}
	/>
</div>

<style>
	.container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 5px;
		border-bottom: 2px solid var(--border-color);
	}

	.header-label {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--text-color);
		transition: color 0.3s;
	}
</style>
