<script lang="ts">
	import MetallicButton from '../../common/MetallicButton.svelte';
	import { createEventDispatcher } from 'svelte';
	import TabRipple from './TabRipple.svelte';

	const dispatch = createEventDispatcher();

	// --- Define allowed variant types explicitly ---
	type NavButtonVariant = 'blue' | 'ghost';

	// --- Props ---
	export let isActive: boolean = false;
	export let onClick: () => void;
	export let index: number = 0;
	export let previousIndex: number = 0;
	export let showText: boolean = true; // Prop to control text visibility

	// --- State ---
	enum ButtonState {
		NORMAL = 'normal',
		ACTIVE = 'active',
		DISABLED = 'disabled'
	}
	let wasActive = false;

	// FIXED: Declare variant variable explicitly
	let variant: NavButtonVariant;

	// Determine button state based on isActive prop
	$: state = isActive ? ButtonState.ACTIVE : ButtonState.NORMAL;

	// FIXED: Removed type annotation from reactive assignment
	// Determine button variant based on isActive prop
	$: variant = isActive ? 'blue' : 'ghost';

	// --- Lifecycle & Logic ---
	// Track active state changes for dispatching 'activated' event
	$: if (isActive !== wasActive) {
		wasActive = isActive;
		if (isActive) {
			// Button became active
			setTimeout(() => {
				dispatch('activated');
			}, 50);
		}
	}

	// Click handler
	function handleClick() {
		onClick();
	}
</script>

<div class="nav-button-wrapper" class:active={isActive} class:text-hidden={!showText}>
	<MetallicButton
		on:click={handleClick}
		{state}
		{variant}
		size={'medium'}
		customClass="nav-button {isActive ? 'active-button' : ''} {showText
			? 'with-text'
			: 'icon-only'}"
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
		transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Base styles for the button via its custom class */
	:global(.nav-button) {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px; /* Consistent rounding */
		transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		font-weight: 500;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
	}

	/* Sizing for buttons WITH text (Desktop Landscape default) */
	:global(.nav-button.with-text) {
		min-width: 110px;
		height: 42px;
		padding: 0 1.2rem;
		font-size: 0.9rem;
		gap: 0.5rem;
		border-radius: 10px;
	}

	/* Sizing for ICON-ONLY buttons (Mobile/Portrait default) */
	:global(.nav-button.icon-only) {
		width: 46px;
		height: 46px;
		padding: 0;
		font-size: 1.3rem;
		border-radius: 12px; /* Slightly rounded square for modern look */
	}

	/* --- Media Queries for Adjustments --- */
	@media (max-width: 1024px) {
		:global(.nav-button.with-text) {
			min-width: 100px;
			height: 38px;
			padding: 0 1rem;
			font-size: 0.85rem;
		}
	}

	@media (max-width: 480px) {
		:global(.nav-button.icon-only) {
			width: 42px;
			height: 42px;
			font-size: 1.2rem;
		}
		:global(.nav-button.with-text) {
			min-width: 90px;
			height: 36px;
			font-size: 0.8rem;
		}
	}

	/* Glow effect for active button */
	.button-highlight {
		position: absolute;
		top: -4px;
		left: -4px;
		right: -4px;
		bottom: -4px;
		border-radius: 14px; /* Default for all buttons */
		background: rgba(108, 156, 233, 0.05);
		box-shadow: 0 0 20px rgba(108, 156, 233, 0.6);
		opacity: 0;
		animation: glow-appear 0.5s forwards 0.1s;
		pointer-events: none;
		z-index: -1;
	}

	/* Style highlight differently when the wrapper does NOT have 'text-hidden' */
	.nav-button-wrapper:not(.text-hidden) .button-highlight {
		border-radius: 14px;
	}

	@keyframes glow-appear {
		0% {
			opacity: 0;
			transform: scale(0.9);
		}
		50% {
			opacity: 0.7;
			transform: scale(1.02);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Active button styling */
	:global(.active-button) {
		position: relative;
		z-index: 1;
		box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
	}

	/* Hover effect */
	.nav-button-wrapper:hover {
		transform: translateY(-2px); /* Subtle lift instead of scale */
	}

	.nav-button-wrapper:hover :global(.nav-button) {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.nav-button-wrapper.active:hover {
		transform: translateY(-1px); /* Smaller lift for active buttons */
	}
</style>
