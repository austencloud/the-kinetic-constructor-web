<!-- src/lib/components/MenuBar/NavWidget/NavButton.svelte -->
<script lang="ts">
	import MetallicButton from '../../common/MetallicButton.svelte';
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { isMobile, isPortrait } from '../../../utils/deviceUtils';
	import TabRipple from './TabRipple.svelte';

	const dispatch = createEventDispatcher();

	export let isActive: boolean = false;
	export let onClick: () => void;
	export let index: number = 0;
	export let previousIndex: number = 0;

	enum ButtonState {
		NORMAL = 'normal',
		ACTIVE = 'active',
		DISABLED = 'disabled'
	}

	let fontSize: number;
	let buttonWidth: number;
	let buttonHeight: number;
	let size: 'small' | 'medium' | 'large' | undefined;
	let state: ButtonState | undefined;
	let variant: 'blue' | 'dark' | 'ghost' | undefined;
	let wasActive = false;

	let isMobileDevice = false;
	let isPortraitMode = false;

	const updateStyles = () => {
		isMobileDevice = isMobile();
		isPortraitMode = isPortrait();

		if (isMobileDevice) {
			// Mobile: Even bigger round buttons
			buttonWidth = Math.max(70, Math.min(120, window.innerWidth / 5));
			buttonHeight = buttonWidth;
			fontSize = buttonWidth * 0.7;
		} else if (isPortraitMode) {
			// Portrait: Even bigger round buttons
			buttonWidth = Math.max(80, Math.min(130, window.innerWidth / 5));
			buttonHeight = buttonWidth;
			fontSize = buttonWidth * 0.7;
		} else {
			// Landscape: Even bigger rectangular buttons
			buttonWidth = Math.max(200, window.innerWidth / 5.5);
			buttonHeight = Math.max(70, window.innerHeight / 12);
			fontSize = Math.min(38, Math.max(28, window.innerWidth / 50));
		}
	};

	onMount(() => {
		updateStyles();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateStyles);
		}

		// Track active state changes
		wasActive = isActive;
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateStyles);
		}
	});

	$: if (typeof window !== 'undefined') {
		updateStyles();
	}

	$: state = isActive ? ButtonState.ACTIVE : ButtonState.NORMAL;
	$: variant = isActive ? 'blue' : 'ghost';
	$: size = isMobileDevice ? 'large' : isPortraitMode ? 'large' : 'large'; // Always use large size

	// Track active state changes
	$: if (isActive !== wasActive) {
		wasActive = isActive;
		if (isActive) {
			// Button became active
			setTimeout(() => {
				dispatch('activated');
			}, 50);
		}
	}

	function handleClick() {
		onClick();
	}
</script>

<div class="nav-button-wrapper" class:active={isActive}>
	<MetallicButton
		on:click={handleClick}
		{state}
		{variant}
		{size}
		customClass="nav-button {isActive ? 'active-button' : ''}"
		{...{ style: `width: ${buttonWidth}px; height: ${buttonHeight}px; font-size: ${fontSize}px;` }}
	>
		<slot />
	</MetallicButton>

	<TabRipple active={isActive} {index} {previousIndex} />

	{#if isActive}
		<div class="button-highlight"></div>
	{/if}
</div>

<style>
	.nav-button-wrapper {
		position: relative;
		transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}


	/* Glow effect for active button */
	.button-highlight {
		position: absolute;
		top: -5px;
		left: -5px;
		right: -5px;
		bottom: -5px;
		border-radius: 15px;
		background: transparent;
		box-shadow: 0 0 20px rgba(108, 156, 233, 0.6);
		opacity: 0;
		animation: glow-appear 0.4s forwards 0.1s;
		pointer-events: none;
		z-index: -1;
	}

	@keyframes glow-appear {
		0% {
			opacity: 0;
			transform: scale(0.9);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	:global(.active-button) {
		position: relative;
		z-index: 10;
		transform: scale(1.05);
	}
</style>
