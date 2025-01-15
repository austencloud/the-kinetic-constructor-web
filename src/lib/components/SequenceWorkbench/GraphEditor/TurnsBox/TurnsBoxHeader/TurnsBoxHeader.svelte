<script lang="ts">
	import PropRotDirButton from './PropRotDirButton.svelte';
  
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
  
	const HEX_RED = '#ED1C24';
	const HEX_BLUE = '#2E3192';
  
	const labelMap = {
	  blue: { text: 'Left', color: HEX_BLUE },
	  red: { text: 'Right', color: HEX_RED }
	};
	$: labelData = labelMap[color] || { text: '', color: '#000000' };
  
	const iconPaths = {
	  clockwise: '/icons/clockwise.png', // Use relative paths for static assets
	  counterClockwise: '/icons/counter_clockwise.png',
	};
  </script>
  
  <div class="turns-box-header" style="--color: {labelData.color};">
	<PropRotDirButton
	  icon={iconPaths.counterClockwise}
	  {color}
	  onClick={handleCCWClick}
	  isPressed={isCCWPressed}
	/>
	<div class="header-label" style="color: {labelData.color};">{labelData.text}</div>
	<PropRotDirButton
	  icon={iconPaths.clockwise}
	  {color}
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
  