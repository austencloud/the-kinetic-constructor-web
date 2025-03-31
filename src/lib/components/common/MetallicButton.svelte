<!-- src/lib/components/common/MetallicButton.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
  
	// Button state enum
	enum ButtonState {
	  NORMAL = 'normal',
	  ACTIVE = 'active',
	  DISABLED = 'disabled'
	}
  
	// Props with defaults
	export let label: string = '';
	export let icon: string | null = null;
	export let state: ButtonState = ButtonState.NORMAL;
	export let disabled: boolean = false;
	export let customClass: string = '';
	export let variant: 'blue' | 'dark' | 'ghost' = 'blue';
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let title: string | null = null; // Added title prop for tooltips
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
	  click: void;
	}>();
  
	// Handle opacity for gradients
	const OPACITY = 0.9; // Increased opacity from 0.7 to 0.9
  
	// Define gradients based on variants and states
	const gradients = {
	  blue: {
		normal: `
		  background: linear-gradient(
			135deg,
			#1e3c72 0%,
			#6c9ce9 30%,
			#4a77d4 60%,
			#2a52be 100%
		  );
		`,
		hover: `
		  background: linear-gradient(
			135deg,
			#264f94 0%,
			#7baafb 30%,
			#5584e1 60%,
			#3563cf 100%
		  );
		`,
		active: `
		  background: linear-gradient(
			135deg,
			#16295a 0%,
			#517bbd 30%,
			#3a62ab 60%,
			#1d3b8c 100%
		  );
		`
	  },
	  dark: {
		normal: `
		  background: linear-gradient(
			135deg,
			rgba(40, 40, 40, ${OPACITY}) 0%,
			rgba(55, 55, 55, ${OPACITY}) 50%,
			rgba(70, 70, 70, ${OPACITY}) 100%
		  );
		`,
		hover: `
		  background: linear-gradient(
			135deg,
			rgba(80, 80, 80, ${OPACITY}) 0%,
			rgba(160, 160, 160, ${OPACITY}) 30%,
			rgba(120, 120, 120, ${OPACITY}) 60%,
			rgba(40, 40, 40, ${OPACITY}) 100%
		  );
		`,
		active: `
		  background: linear-gradient(
			135deg,
			#1e3c72 0%,
			#6c9ce9 30%,
			#4a77d4 60%, 
			#2a52be 100%
		  );
		`
	  },
	  ghost: {
		normal: `
		  background: rgba(70, 70, 70, 0.7);
		`,
		hover: `
		  background: rgba(100, 100, 100, 0.8);
		`,
		active: `
		  background: linear-gradient(
			135deg,
			#1e3c72 0%,
			#6c9ce9 30%,
			#4a77d4 60%,
			#2a52be 100%
		  );
		`
	  }
	};
  
	// Define colors based on variants and states
	const colors = {
	  blue: {
		normal: 'white',
		hover: 'white',
		active: 'white',
		disabled: '#aaaaaa'
	  },
	  dark: {
		normal: 'white',
		hover: 'white',
		active: 'white',
		disabled: '#888888'
	  },
	  ghost: {
		normal: 'white',
		hover: 'white',
		active: 'white',
		disabled: '#888888'
	  }
	};
  
	// Border colors
	const borders = {
	  blue: {
		normal: 'rgba(255, 255, 255, 0.5)',
		hover: 'white',
		active: 'white',
		disabled: 'rgba(255, 255, 255, 0.3)'
	  },
	  dark: {
		normal: 'rgba(255, 255, 255, 0.3)',
		hover: 'rgba(255, 255, 255, 0.6)',
		active: 'rgba(255, 255, 255, 0.7)',
		disabled: 'rgba(255, 255, 255, 0.2)'
	  },
	  ghost: {
		normal: 'rgba(255, 255, 255, 0.5)',
		hover: 'rgba(255, 255, 255, 0.7)',
		active: 'rgba(255, 255, 255, 0.8)',
		disabled: 'rgba(255, 255, 255, 0.3)'
	  }
	};
  
	// Size mappings - UPDATED FOR LARGER BUTTONS
	const sizes = {
	  small: {
		padding: '8px 16px',  // Increased from 6px 12px
		fontSize: '1rem',     // Increased from 0.85rem
		iconSize: '1.1rem'    // Increased from 0.9rem
	  },
	  medium: {
		padding: '12px 20px', // Increased from 8px 16px
		fontSize: '1.2rem',   // Increased from 1rem
		iconSize: '1.3rem'    // Increased from 1.1rem
	  },
	  large: {
		padding: '14px 28px', // Increased from 10px 20px
		fontSize: '1.4rem',   // Increased from 1.15rem
		iconSize: '1.6rem'    // Increased from 1.3rem
	  }
	};
  
	// Icon spacing
	const iconSpacing = icon && label ? '0.5rem' : '0';
  
	// Compute actual state based on disabled prop
	$: actualState = disabled ? ButtonState.DISABLED : state;
  
	// Get current style based on variant, state and disabled status
	$: buttonStyles = computeButtonStyles(variant, actualState);
  
	// Function to compute appropriate styles
	function computeButtonStyles(variant: 'blue' | 'dark' | 'ghost', state: ButtonState): string {
	  // For disabled state
	  if (state === ButtonState.DISABLED) {
		if (variant === 'blue') {
		  return `
			background: linear-gradient(
			  135deg,
			  rgba(30, 60, 114, 0.5) 0%,
			  rgba(108, 156, 233, 0.5) 30%,
			  rgba(74, 119, 212, 0.5) 60%,
			  rgba(42, 82, 190, 0.5) 100%
			);
			color: ${colors[variant].disabled};
			border-color: ${borders[variant].disabled};
			pointer-events: none;
		  `;
		} else {
		  return `
			opacity: 0.6;
			color: ${colors[variant].disabled};
			border-color: ${borders[variant].disabled};
			${gradients[variant].normal}
			pointer-events: none;
		  `;
		}
	  }
  
	  // For active state
	  if (state === ButtonState.ACTIVE) {
		return `
		  ${gradients[variant].normal}
		  color: ${colors[variant].active};
		  border-color: ${borders[variant].active};
		  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
		`;
	  }
  
	  // Normal state
	  return `
		${gradients[variant].normal}
		color: ${colors[variant].normal};
		border-color: ${borders[variant].normal};
	  `;
	}
  
	// Click handler
	function handleClick() {
	  if (!disabled) {
		dispatch('click');
	  }
	}
  </script>
  
  <button
	class="metallic-button {size} {variant} {actualState} {customClass}"
	{disabled}
	{title}
	style={buttonStyles}
	on:click={handleClick}
	on:mouseenter
	on:mouseleave
	on:focus
	on:blur
  >
	{#if icon}
	  <div class="icon" style={`margin-right: ${label ? iconSpacing : 0}`}>
		<img src={icon} alt="" />
	  </div>
	{/if}
  
	{#if label}
	  <span>{label}</span>
	{/if}
  
	<slot></slot>
  </button>
  
  <style>
	.metallic-button {
	  display: inline-flex;
	  align-items: center;
	  justify-content: center;
	  border: 1px solid;
	  border-radius: 10px; /* Increased from 8px */
	  cursor: pointer;
	  font-weight: 600; /* Increased from 500 */
	  letter-spacing: 0.025em;
	  transition: all 0.2s ease;
	  position: relative;
	  overflow: hidden;
	  text-align: center;
	  outline: none;
	  min-width: 2.5em; /* Ensure buttons have minimum width */
	  min-height: 2.5em; /* Ensure buttons have minimum height */
	}
  
	/* Size variants - UPDATED FOR LARGER BUTTONS */
	.small {
	  padding: 8px 16px; /* Increased from 6px 12px */
	  font-size: 1rem; /* Increased from 0.85rem */
	}
  
	.medium {
	  padding: 12px 20px; /* Increased from 8px 16px */
	  font-size: 1.2rem; /* Increased from 1rem */
	}
  
	.large {
	  padding: 14px 28px; /* Increased from 10px 20px */
	  font-size: 1.4rem; /* Increased from 1.15rem */
	}
  
	/* Hover effects by variant */
	.blue:not(.disabled):hover {
	  background: linear-gradient(135deg, #264f94 0%, #7baafb 30%, #5584e1 60%, #3563cf 100%);
	  transform: translateY(-2px); /* Enhanced from -1px */
	  box-shadow: 0 6px 15px rgba(26, 73, 173, 0.5); /* Enhanced shadow */
	  border-color: white;
	}
  
	.dark:not(.disabled):hover {
	  background: linear-gradient(
		135deg,
		rgba(80, 80, 80, 0.9) 0%,
		rgba(160, 160, 160, 0.9) 30%,
		rgba(120, 120, 120, 0.9) 60%,
		rgba(40, 40, 40, 0.9) 100%
	  );
	  transform: translateY(-2px); /* Enhanced from -1px */
	  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3); /* Enhanced shadow */
	  border-color: rgba(255, 255, 255, 0.6);
	}
  
	.ghost:not(.disabled):hover {
	  background: rgba(100, 100, 100, 0.8);
	  color: white;
	  border-color: rgba(255, 255, 255, 0.7);
	  transform: translateY(-2px); /* Added transform effect to ghost */
	  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2); /* Added shadow to ghost */
	}
  
	/* Active/pressed state - all turn blue when pressed */
	.blue:not(.disabled):active,
	.dark:not(.disabled):active,
	.ghost:not(.disabled):active {
	  transform: translateY(1px);
	  box-shadow: 0 2px 8px rgba(26, 73, 173, 0.4); /* Enhanced shadow */
	  background: linear-gradient(135deg, #16295a 0%, #517bbd 30%, #3a62ab 60%, #1d3b8c 100%);
	  border-color: white;
	}
  
	/* Icon styling - UPDATED FOR LARGER ICONS */
	.icon {
	  display: flex;
	  align-items: center;
	  justify-content: center;
	}
  
	.small .icon img {
	  width: 1.1rem; /* Increased from 0.9rem */
	  height: 1.1rem; /* Increased from 0.9rem */
	}
  
	.medium .icon img {
	  width: 1.3rem; /* Increased from 1.1rem */
	  height: 1.3rem; /* Increased from 1.1rem */
	}
  
	.large .icon img {
	  width: 1.6rem; /* Increased from 1.3rem */
	  height: 1.6rem; /* Increased from 1.3rem */
	}
  
	/* Focus state for accessibility */
	.metallic-button:focus-visible {
	  outline: 2px solid white;
	  outline-offset: 3px; /* Increased from 2px */
	}
  </style>