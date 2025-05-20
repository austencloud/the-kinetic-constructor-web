<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/TurnsBox.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import {
		turnsStore,
		blueTurns,
		redTurns,
		type Direction,
		isMinTurns,
		isMaxTurns
	} from '$lib/stores/sequence/turnsStore';
	import { createEventDispatcher } from 'svelte';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';

	// Component props
	export let color: 'blue' | 'red';

	// Simple component state (UI only, not duplicating store data)
	let isDialogOpen = false;

	// Create event dispatcher
	const dispatch = createEventDispatcher<{
		turnsChanged: { color: 'blue' | 'red'; turns: any };
		directionChanged: { color: 'blue' | 'red'; direction: Direction };
	}>();

	// Get derived state from stores
	$: turnsData = color === 'blue' ? $blueTurns : $redTurns;
	$: direction = turnsData.direction;
	$: turns = turnsData.turns;

	// Color configurations
	const COLORS = {
		blue: {
			text: 'Left',
			primary: '#2E3192',
			light: 'rgba(46,49,146,0.4)',
			medium: 'rgba(46,49,146,0.8)',
			gradient: 'linear-gradient(135deg, rgba(46,49,146,0.1), rgba(46,49,146,0.8)), #fff'
		},
		red: {
			text: 'Right',
			primary: '#ED1C24',
			light: 'rgba(237,28,36,0.4)',
			medium: 'rgba(237,28,36,0.8)',
			gradient: 'linear-gradient(135deg, rgba(237,28,36,0.1), rgba(237,28,36,0.8)), #fff'
		}
	};

	// Available turns values for the dialog
	const TURNS_VALUES = ['fl', '0', '0.5', '1', '1.5', '2', '2.5', '3'];

	// Computed values based on color
	$: colorConfig = COLORS[color];
	$: dialogBackground = `linear-gradient(135deg, ${colorConfig.light}, ${colorConfig.medium}), #fff`;

	// Icon paths
	const iconPaths = {
		clockwise: '/icons/clockwise.png',
		counterClockwise: '/icons/counter_clockwise.png'
	};

	// Event handlers
	function handleSetDirection(newDirection: Direction) {
		turnsStore.setDirection(color, newDirection);

		// Trigger haptic feedback
		hapticFeedbackService.trigger('selection');

		// Dispatch event
		dispatch('directionChanged', { color, direction: newDirection });
	}

	function handleOpenDialog() {
		isDialogOpen = true;
		hapticFeedbackService.trigger('navigation');
	}

	function handleCloseDialog() {
		isDialogOpen = false;
		hapticFeedbackService.trigger('navigation');
	}

	function handleSelectTurns(value: string) {
		const newTurns = value === 'fl' ? 'fl' : parseFloat(value);
		turnsStore.setTurns(color, newTurns);
		isDialogOpen = false;

		// Trigger haptic feedback
		hapticFeedbackService.trigger('selection');

		// Dispatch event
		dispatch('turnsChanged', { color, turns: newTurns });
	}

	function handleIncrement() {
		turnsStore.incrementTurns(color);

		// Trigger haptic feedback
		hapticFeedbackService.trigger('selection');

		// Dispatch event
		dispatch('turnsChanged', { color, turns: turnsData.turns });
	}

	function handleDecrement() {
		turnsStore.decrementTurns(color);

		// Trigger haptic feedback
		hapticFeedbackService.trigger('selection');

		// Dispatch event
		dispatch('turnsChanged', { color, turns: turnsData.turns });
	}

	// Close dialog on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isDialogOpen) {
			handleCloseDialog();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class="turns-box"
	style="--box-color: {colorConfig.primary}; --box-gradient: {colorConfig.gradient};"
>
	<!-- Header with direction buttons -->
	<div class="turns-box-header">
		<!-- Counter-clockwise button -->
		<button
			class="direction-button"
			class:active={direction === 'counterclockwise'}
			style="--color: {colorConfig.primary};"
			on:click={() => handleSetDirection('counterclockwise')}
			aria-label="Counter-clockwise rotation"
			aria-pressed={direction === 'counterclockwise'}
		>
			<div class="direction-icon counterclockwise-icon">
				<img class="icon" src={iconPaths.counterClockwise} alt="Counter-clockwise Icon" />
			</div>
			<span class="direction-text">CCW</span>
		</button>

		<!-- Label -->
		<div class="header-label" style="color: {colorConfig.primary};">{colorConfig.text}</div>

		<!-- Clockwise button -->
		<button
			class="direction-button"
			class:active={direction === 'clockwise'}
			style="--color: {colorConfig.primary};"
			on:click={() => handleSetDirection('clockwise')}
			aria-label="Clockwise rotation"
			aria-pressed={direction === 'clockwise'}
		>
			<div class="direction-icon clockwise-icon">
				<img class="icon" src={iconPaths.clockwise} alt="Clockwise Icon" />
			</div>
			<span class="direction-text">CW</span>
		</button>
	</div>

	<!-- Turns widget -->
	<div class="turns-widget">
		<div class="turns-text-label">Turns</div>

		<div class="turns-control-container">
			<!-- Turns label/button -->
			<button
				class="turns-label"
				style="--color: {colorConfig.primary}"
				on:click={handleOpenDialog}
				aria-label="Set turns value"
			>
				<span class="turns-value">{turns}</span>
			</button>

			<!-- Increment/Decrement buttons -->
			<div class="increment-buttons-row">
				<!-- Decrement button -->
				<button
					class="increment-button"
					style="--color: {colorConfig.primary}"
					on:click={handleDecrement}
					aria-label="Decrease turns"
					disabled={isMinTurns(turns)}
				>
					−
				</button>

				<!-- Increment button -->
				<button
					class="increment-button"
					style="--color: {colorConfig.primary}"
					on:click={handleIncrement}
					aria-label="Increase turns"
					disabled={isMaxTurns(turns)}
				>
					+
				</button>
			</div>
		</div>

		<div class="motion-type-label">Pro</div>
	</div>

	<!-- Direct set dialog (appears when turns label is clicked) -->
	{#if isDialogOpen}
		<div class="dialog-container" transition:fly={{ y: 20, duration: 200 }}>
			<!-- Overlay for closing on outside click -->
			<div
				class="overlay"
				on:click|stopPropagation={handleCloseDialog}
				on:keydown={(e) => e.key === 'Enter' && handleCloseDialog()}
				aria-label="Close dialog"
				tabindex="0"
				role="button"
			></div>

			<!-- Dialog content -->
			<div
				class="dialog"
				style="
			border-color: {colorConfig.primary};
			background: {dialogBackground};
		  "
			>
				{#each TURNS_VALUES as value}
					<button
						class="direct-set-button"
						style="border-color: {colorConfig.primary};"
						on:click={() => handleSelectTurns(value)}
						aria-label={`Set turns to ${value}`}
					>
						{value}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Box container */
	.turns-box {
		position: relative;
		flex: 1;
		border: 4px solid var(--box-color);
		display: flex;
		flex-direction: column;
		background: var(--box-gradient);
		align-self: stretch;
		min-width: 0;
		border-radius: 16px; /* Increased border radius for modern look */
		overflow: hidden; /* Ensure content doesn't overflow rounded corners */
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.15),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 3px rgba(255, 255, 255, 0.2); /* Enhanced shadow for depth */
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease; /* Smooth transitions */
	}

	/* Header styles */
	.turns-box-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px; /* Increased padding for better spacing */
		border-bottom: 3px solid var(--box-color);
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.15),
			rgba(255, 255, 255, 0.05)
		); /* Enhanced gradient for visual interest */
	}

	.header-label {
		font-size: clamp(1.5rem, 4vw, 1.8rem); /* Responsive font size */
		font-weight: bold;
		transition: color 0.2s ease;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); /* Enhanced text shadow for better readability */
		letter-spacing: 0.5px; /* Slightly improved letter spacing */
	}

	.direction-button {
		width: clamp(60px, 20vw, 80px); /* Wider for better touch targets */
		height: clamp(60px, 15vw, 70px); /* Not as tall to fit text below icon */
		border: 2px solid var(--color);
		border-radius: 12px; /* Slightly more rounded corners */
		background-color: white;
		cursor: pointer;
		display: flex;
		flex-direction: column; /* Stack icon and text vertically */
		justify-content: center;
		align-items: center;
		gap: 4px; /* Space between icon and text */
		padding: 6px 4px; /* Add padding for content */
		transition:
			background-color 0.2s ease,
			transform 0.15s ease-in-out,
			box-shadow 0.2s ease;
		box-shadow:
			0px 2px 8px rgba(0, 0, 0, 0.15),
			inset 0px 1px 3px rgba(255, 255, 255, 0.7);
		position: relative; /* For pseudo-elements */
		overflow: hidden; /* Contain pseudo-elements */
	}

	/* Add subtle gradient overlay */
	.direction-button::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.3));
		border-radius: 10px;
		opacity: 0.8;
		transition: opacity 0.2s ease;
	}

	.direction-button:hover {
		background-color: #f8f8f8;
		box-shadow:
			0px 4px 12px rgba(0, 0, 0, 0.25),
			inset 0px 1px 3px rgba(255, 255, 255, 0.8);
		transform: translateY(-2px);
	}

	.direction-button:hover::before {
		opacity: 0.9;
	}

	.direction-button.active {
		background-color: var(--color);
		color: white;
		box-shadow:
			inset 0px 2px 6px rgba(0, 0, 0, 0.3),
			inset 0px 1px 2px rgba(255, 255, 255, 0.2),
			0px 2px 4px rgba(0, 0, 0, 0.2);
		transform: translateY(1px);
	}

	.direction-button.active::before {
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.1));
		opacity: 0.6;
	}

	.direction-icon {
		position: relative;
		width: 70%;
		height: 70%;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1; /* Above the pseudo-element */
	}

	.direction-text {
		font-size: clamp(0.7rem, 2.5vw, 0.9rem);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		z-index: 1; /* Above the pseudo-element */
	}

	.icon {
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
	}

	/* Specific styling for active state icons */
	.direction-button.active .icon {
		filter: drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5)) brightness(1.2);
	}

	/* Turns widget styles */
	.turns-widget {
		display: flex;
		flex-direction: column;
		gap: clamp(10px, 3vw, 16px); /* Increased responsive gap */
		padding: clamp(16px, 4vw, 24px); /* Increased responsive padding */
		flex: 1;
		justify-content: center; /* Center content vertically */
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.05),
			rgba(255, 255, 255, 0.15),
			rgba(255, 255, 255, 0.05)
		); /* Subtle gradient background */
	}

	.turns-text-label {
		font-weight: bold;
		text-align: center;
		font-size: clamp(1.2rem, 3vw, 1.5rem); /* Responsive font size */
		position: relative;
		display: inline-block;
		margin: 0 auto;
		padding-bottom: 4px;
		color: rgba(0, 0, 0, 0.8); /* Slightly darker for better contrast */
	}

	/* Add a modern underline effect */
	.turns-text-label::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 10%;
		right: 10%;
		height: 2px;
		background: var(--color, #000);
		opacity: 0.7;
		border-radius: 2px;
	}

	.turns-control-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		width: 100%;
		margin: 8px 0;
	}

	.increment-buttons-row {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 16px;
		width: 100%;
	}

	.increment-button {
		width: clamp(40px, 15vw, 60px); /* Fixed width range for better consistency */
		height: clamp(40px, 15vw, 60px); /* Fixed height range for better consistency */
		background-color: white;
		color: black;
		border: 3px solid var(--color);
		border-radius: 50%;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			background-color 0.15s ease; /* Faster transitions */
		font-size: clamp(1.5em, 4vw, 2em); /* Responsive font size */
		/* Add subtle shadow for depth */
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0; /* Remove default button padding */
		line-height: 1; /* Ensure proper vertical alignment of text */
	}

	.increment-button:hover:enabled {
		transform: scale(1.1);
		background-color: #f8f8f8;
		box-shadow:
			0px 4px 8px rgba(0, 0, 0, 0.3),
			inset 0px 1px 3px rgba(255, 255, 255, 0.5);
	}

	.increment-button:active:enabled {
		transform: scale(0.95);
		background-color: #f0f0f0;
		box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.2);
	}

	.increment-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.turns-label {
		color: black;
		font-weight: bold;
		display: flex;
		justify-content: center;
		cursor: pointer;
		border: 4px solid var(--color);
		background-color: white;
		border-radius: 50%;
		align-items: center;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			background-color 0.15s ease; /* Faster transitions */
		/* Add subtle shadow for depth */
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
		/* Fixed size with responsive constraints */
		width: clamp(100px, 30vw, 140px);
		height: clamp(100px, 30vw, 140px);
		padding: 0; /* Remove default button padding */
	}

	.turns-value {
		font-size: clamp(2.5em, 6vw, 3.5em); /* Responsive font size */
		/* Ensure text doesn't overflow */
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1; /* Ensure proper vertical alignment */
	}

	.turns-label:hover {
		transform: scale(1.05);
		background-color: #f8f8f8;
		box-shadow:
			0px 4px 8px rgba(0, 0, 0, 0.3),
			inset 0px 1px 3px rgba(255, 255, 255, 0.5);
	}

	.turns-label:active {
		transform: scale(0.95);
		background-color: #f0f0f0;
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
	}

	.motion-type-label {
		font-style: italic;
		text-align: center;
		color: black;
		font-size: clamp(1.2rem, 3vw, 1.5rem); /* Responsive font size */
		margin-top: 8px;
		font-weight: 500; /* Slightly bolder for better readability */
	}

	/* Dialog styles */
	.dialog-container {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.overlay {
		position: absolute;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.4); /* Darker overlay for better contrast */
		z-index: 0;
		cursor: pointer;
		backdrop-filter: blur(3px); /* Enhanced blur effect */
	}

	.dialog {
		position: relative;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 5%; /* Increased gap for better spacing */
		border: 3px solid;
		border-radius: 16px; /* Increased border radius for modern look */
		padding: 5%; /* Increased padding for better spacing */
		z-index: 1;
		height: 80%;
		width: 80%;
		align-items: center;
		justify-content: space-evenly;
		box-shadow:
			0 10px 30px rgba(0, 0, 0, 0.3),
			0 4px 10px rgba(0, 0, 0, 0.2); /* Enhanced shadow for depth */
		background-image: linear-gradient(
			to bottom right,
			rgba(255, 255, 255, 0.9),
			rgba(255, 255, 255, 0.7)
		); /* Add subtle gradient */
	}

	.direct-set-button {
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: white;
		cursor: pointer;
		font-weight: bold;
		width: 100%;
		transition:
			background-color 0.2s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
		aspect-ratio: 1 / 1;
		font-size: clamp(1.5em, 4vw, 2em); /* Responsive font size */
		border: 3px solid; /* Slightly thinner border */
		/* Add subtle shadow for depth */
		box-shadow:
			0 3px 8px rgba(0, 0, 0, 0.15),
			inset 0 1px 3px rgba(255, 255, 255, 0.8);
		min-height: 50px; /* Ensure minimum height for touch targets */
		position: relative; /* For pseudo-element */
		overflow: hidden; /* Contain pseudo-element */
	}

	/* Add subtle gradient overlay */
	.direct-set-button::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.3));
		border-radius: 50%;
		opacity: 0.8;
		transition: opacity 0.2s ease;
	}

	.direct-set-button:hover {
		background-color: #f0f4ff; /* Lighter blue tint */
		box-shadow:
			0 5px 12px rgba(0, 0, 0, 0.2),
			inset 0 1px 3px rgba(255, 255, 255, 0.9);
		transform: translateY(-2px) scale(1.05);
	}

	.direct-set-button:hover::before {
		opacity: 0.9;
	}

	.direct-set-button:active {
		background-color: #e0e7ff; /* Slightly darker when active */
		box-shadow:
			inset 0 3px 6px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
		transform: translateY(1px) scale(0.98);
	}

	/* Responsive adjustments for different screen sizes */
	@media (max-width: 768px) {
		.turns-box {
			border-width: 3px;
		}

		.turns-box-header {
			padding: 10px 12px;
		}

		.turns-widget {
			padding: clamp(12px, 3vw, 16px);
			gap: 8px;
		}

		.direction-button {
			width: clamp(50px, 18vw, 70px);
			height: clamp(50px, 13vw, 60px);
		}

		.direction-text {
			font-size: 0.7rem;
		}

		.turns-control-container {
			gap: 8px;
		}
	}

	@media (max-width: 480px) {
		.turns-box {
			border-width: 2px;
			border-radius: 12px;
		}

		.direction-button {
			border-width: 1px;
			width: clamp(45px, 16vw, 60px);
			height: clamp(45px, 12vw, 55px);
		}

		.turns-label {
			width: clamp(80px, 25vw, 110px);
			height: clamp(80px, 25vw, 110px);
			border-width: 3px;
		}

		.turns-value {
			font-size: clamp(2em, 5vw, 3em);
		}

		.increment-button {
			width: clamp(35px, 12vw, 50px);
			height: clamp(35px, 12vw, 50px);
			border-width: 2px;
		}

		.header-label {
			font-size: clamp(1.2rem, 3.5vw, 1.5rem);
		}

		.turns-text-label {
			font-size: clamp(1rem, 2.8vw, 1.3rem);
		}

		.motion-type-label {
			font-size: clamp(1rem, 2.8vw, 1.3rem);
		}
	}

	/* Extra small screens */
	@media (max-width: 360px) {
		.turns-box-header {
			padding: 8px;
		}

		.direction-button {
			width: clamp(40px, 15vw, 50px);
			height: clamp(40px, 11vw, 50px);
		}

		.direction-text {
			font-size: 0.6rem;
		}

		.turns-widget {
			padding: 10px;
		}

		.turns-label {
			width: clamp(70px, 22vw, 90px);
			height: clamp(70px, 22vw, 90px);
		}

		.increment-buttons-row {
			gap: 10px;
		}
	}
</style>
