<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/TurnsBox.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { turnsStore } from '$lib/stores/turnsStore';
  
	export let color: 'blue' | 'red';
  
	// State
	let isDialogOpen = false;
	let isCWPressed = false;
	let isCCWPressed = false;
	
	// Get the turns value from the store based on color
	$: turnsValue = color === 'blue' ? $turnsStore.blue : $turnsStore.red;
	
	// Constants and computed values
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
	
	$: colorConfig = COLORS[color];
	$: dialogBackground = `linear-gradient(135deg, ${colorConfig.light}, ${colorConfig.medium}), #fff`;
  
	// Available turns values and utility functions
	const TURNS_VALUES = ['fl', '0', '0.5', '1', '1.5', '2', '2.5', '3'];
	
	const iconPaths = {
	  clockwise: '/icons/clockwise.png',
	  counterClockwise: '/icons/counter_clockwise.png'
	};
	
	// Only allow valid turns values
	function isMinTurns(value: string | number): boolean {
	  return value === 'fl' || value === -0.5 || value === 0;
	}
	
	function isMaxTurns(value: number): boolean {
	  return value === 3;
	}
	
	// Event handlers
	function handleCWClick() {
	  isCWPressed = true;
	  isCCWPressed = false;
	  // Here you would update rotation direction in a store
	}
  
	function handleCCWClick() {
	  isCWPressed = false;
	  isCCWPressed = true;
	  // Here you would update rotation direction in a store
	}
	
	function handleOpenDialog() {
	  isDialogOpen = true;
	}
  
	function handleCloseDialog() {
	  isDialogOpen = false;
	}
	
	function handleSelectTurns(value: string) {
	  // Convert "fl" to special value or parse float
	  const turns = value === 'fl' ? 'fl' : parseFloat(value);
	  turnsStore.setTurns(color, turns);
	  isDialogOpen = false;
	}
	
	function handleIncrement() {
	  turnsStore.incrementTurns(color);
	}
	
	function handleDecrement() {
	  turnsStore.decrementTurns(color);
	}
	
	// Keyboard handler for dialog
	function handleKeydown(event: KeyboardEvent) {
	  if (event.key === 'Escape') {
		handleCloseDialog();
	  }
	}
  </script>
  
  <svelte:window on:keydown={isDialogOpen ? handleKeydown : null}/>
  
  <div class="turns-box" style="--box-color: {colorConfig.primary}; --box-gradient: {colorConfig.gradient};">
	<!-- Header with direction buttons -->
	<div class="turns-box-header">
	  <!-- Counter-clockwise button -->
	  <button
		class="direction-button"
		style="--color: {colorConfig.primary}; 
			   --background-color: {isCCWPressed ? colorConfig.primary : 'white'};"
		on:click={handleCCWClick}
		aria-label="Counter-clockwise rotation"
		aria-pressed={isCCWPressed}
	  >
		<img class="icon" src={iconPaths.counterClockwise} alt="Counter-clockwise Icon" />
	  </button>
	  
	  <!-- Label -->
	  <div class="header-label" style="color: {colorConfig.primary};">{colorConfig.text}</div>
	  
	  <!-- Clockwise button -->
	  <button
		class="direction-button"
		style="--color: {colorConfig.primary}; 
			   --background-color: {isCWPressed ? colorConfig.primary : 'white'};"
		on:click={handleCWClick}
		aria-label="Clockwise rotation"
		aria-pressed={isCWPressed}
	  >
		<img class="icon" src={iconPaths.clockwise} alt="Clockwise Icon" />
	  </button>
	</div>
	
	<!-- Turns widget -->
	<div class="turns-widget">
	  <div class="turns-text-label">Turns</div>
	  
	  <div class="turns-display-frame">
		<!-- Decrement button -->
		<button
		  class="increment-button"
		  style="--color: {colorConfig.primary}"
		  on:click={handleDecrement}
		  aria-label="Decrease turns"
		  disabled={isMinTurns(turnsValue.turns)}
		>
		  −
		</button>
		
		<!-- Turns label/button -->
		<button
		  class="turns-label"
		  style="--color: {colorConfig.primary}"
		  on:click={handleOpenDialog}
		  aria-label="Set turns value"
		>
		  {turnsValue.turns}
		</button>
		
		<!-- Increment button -->
		<button
		  class="increment-button"
		  style="--color: {colorConfig.primary}"
		  on:click={handleIncrement}
		  aria-label="Increase turns"
		  disabled={typeof turnsValue === 'number' ? isMaxTurns(turnsValue) : false}
		>
		  +
		</button>
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
	  height: 100%;
	  min-width: 0;
	}
	
	/* Header styles */
	.turns-box-header {
	  display: flex;
	  justify-content: space-between;
	  align-items: center;
	  padding: 5px;
	  border-bottom: 3px solid var(--box-color);
	}
	
	.header-label {
	  font-size: 1.8rem;
	  font-weight: bold;
	  transition: color 0.3s ease;
	}
	
	.direction-button {
	  width: 4rem;
	  height: 4rem;
	  border: 2px solid var(--color);
	  border-radius: 10px;
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
		inset 0px 1px 3px rgba(255, 255, 255, 0.5);
	}
	
	.direction-button:hover {
	  background-color: #f5f5f5;
	  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3),
		inset 0px 1px 3px rgba(255, 255, 255, 0.5),
		0px 0px 5px rgba(255, 255, 255, 0.8);
	  transform: scale(1.05);
	}
	
	.direction-button:active,
	.direction-button[aria-pressed='true'] {
	  background-color: var(--color);
	  box-shadow: inset 0px 4px 6px rgba(0, 0, 0, 0.3),
		inset 0px 2px 4px rgba(255, 255, 255, 0.3);
	  transform: translateY(2px);
	}
	
	.direction-button[aria-pressed='true'] {
	  cursor: default;
	}
	
	.icon {
	  width: 100%;
	  height: 100%;
	  object-fit: contain;
	  filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
	}
	
	/* Turns widget styles */
	.turns-widget {
	  display: flex;
	  flex-direction: column;
	  gap: 10px;
	  padding: 10px;
	  flex: 1;
	  justify-content: space-evenly;
	}
	
	.turns-text-label {
	  font-weight: bold;
	  text-decoration: underline;
	  text-align: center;
	  font-size: 1.5rem;
	}
	
	.turns-display-frame {
	  display: flex;
	  justify-content: space-evenly;
	  align-items: center;
	  width: 100%;
	}
	
	.increment-button {
	  width: 20%;
	  background-color: white;
	  color: black;
	  border: 4px solid var(--color);
	  border-radius: 50%;
	  cursor: pointer;
	  transition: transform 0.2s;
	  aspect-ratio: 1/1;
	  transition-duration: 0.1s;
	  font-size: 2em;
	}
	
	.increment-button:hover:enabled {
	  transform: scale(1.1);
	  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3),
		inset 0px 1px 3px rgba(255, 255, 255, 0.5);
	}
	
	.increment-button:active:enabled {
	  transform: scale(0.9);
	}
	
	.increment-button:disabled {
	  opacity: 0.5;
	  cursor: not-allowed;
	}
	
	.turns-label {
	  color: black;
	  font-weight: bold;
	  font-size: 3.5em;
	  display: flex;
	  justify-content: center;
	  cursor: pointer;
	  border: 4px solid var(--color);
	  background-color: white;
	  width: 30%;
	  border-radius: 50%;
	  height: 100%;
	  align-items: center;
	  transition:
		transform 0.1s,
		background-color 0.2s;
	}
	
	.turns-label:hover {
	  transform: scale(1.1);
	  box-shadow:
		0px 4px 8px rgba(0, 0, 0, 0.3),
		inset 0px 1px 3px rgba(255, 255, 255, 0.5);
	}
	
	.turns-label:active {
	  transform: scale(0.9);
	}
	
	.motion-type-label {
	  font-style: italic;
	  text-align: center;
	  color: black;
	  font-size: 1.5rem;
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
	  background-color: rgba(0, 0, 0, 0.2);
	  z-index: 0;
	  cursor: pointer;
	}
	
	.dialog {
	  position: relative;
	  display: grid;
	  grid-template-columns: repeat(4, 1fr);
	  gap: 3%;
	  border: 3px solid;
	  border-radius: 5%;
	  padding: 3%;
	  z-index: 1;
	  height: 80%;
	  width: 80%;
	  align-items: center;
	  justify-content: space-evenly;
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
		background-color 0.3s,
		transform 0.2s,
		box-shadow 0.2s;
	  aspect-ratio: 1 / 1;
	  font-size: 2em;
	  border: 4px solid;
	}
	
	.direct-set-button:hover {
	  background-color: #e0e7ff;
	  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
	  transform: scale(1.1);
	}
	
	.direct-set-button:active {
	  background-color: #c7d2fe;
	  box-shadow: inset 0px 4px 8px rgba(0, 0, 0, 0.2);
	}
  </style>