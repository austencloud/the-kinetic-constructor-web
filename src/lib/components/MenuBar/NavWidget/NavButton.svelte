<!-- src/lib/components/MenuBar/NavWidget/NavButton.svelte -->
<script lang="ts">
	import MetallicButton from '../../common/MetallicButton.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { isMobile, isPortrait } from '../../../utils/deviceUtils';

	export let isActive: boolean = false;
	export let onClick: () => void;
	enum ButtonState {
	  NORMAL = 'normal',
	  ACTIVE = 'active',
	  DISABLED = 'disabled'
	}
	let fontSize: number;
	let buttonWidth: number;
	let buttonHeight: number;
	let size: "small" | "medium" | "large" | undefined;
	let state: ButtonState | undefined;
	let variant: "blue" | "dark" | "ghost" | undefined;

	let isMobileDevice = false;
	let isPortraitMode = false;

	const updateStyles = () => {
		isMobileDevice = isMobile();
		isPortraitMode = isPortrait();

		if (isMobileDevice) {
			// Mobile: Always round buttons
			buttonWidth = Math.max(30, Math.min(60, window.innerWidth / 10));
			buttonHeight = buttonWidth;
			fontSize = buttonWidth * 0.5;
		} else if (isPortraitMode) {
			// Desktop Portrait: Round buttons
			buttonWidth = Math.max(30, Math.min(60, window.innerWidth / 10));
			buttonHeight = buttonWidth;
			fontSize = buttonWidth * 0.5;
		} else {
			// Desktop Landscape: Rectangular buttons
			buttonWidth = Math.max(120, window.innerWidth / 8);
			buttonHeight = Math.max(40, window.innerHeight / 20);
			fontSize = Math.min(26, Math.max(18, window.innerWidth / 70));
		}
	};

	onMount(() => {
		updateStyles();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateStyles);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateStyles);
		}
	});

	$: if (typeof window !== 'undefined') {
		updateStyles(); // Ensure updates on reactivity
	}

	// Derive button state and size variant
	$: state = isActive ? ButtonState.ACTIVE : ButtonState.NORMAL;
	$: size = isMobileDevice ? 'small' : isPortraitMode ? 'small' : 'medium';
	$: size = isMobileDevice ? 'small' : (isPortraitMode ? 'small' : 'medium');
</script>

<MetallicButton
	on:click={onClick}
	state={state}
	variant={variant}
	size={size}
	customClass="nav-button"
	{...{ style: `width: ${buttonWidth}px; height: ${buttonHeight}px; font-size: ${fontSize}px;` }}
>
	<slot />
</MetallicButton>

