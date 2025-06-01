<!--
  Modern BeatCell Component
  Pure presentation component for individual beats
  Optimized for performance with proper event handling
-->
<script lang="ts">
  import type { BeatData } from '../BeatData';
  import Beat from '../Beat.svelte';
  import AnimatedHighlight from '../GoldSelectionBorder.svelte';
  import ReversalGlyph from '../ReversalGlyph.svelte';
  import hapticFeedbackService from '$lib/services/HapticFeedbackService';

  // Props using Svelte 5 runes
  const props = $props<{
    beat: BeatData;
    isSelected: boolean;
    onClick: () => void;
    onDoubleClick: () => void;
    animationDelay?: number;
  }>();

  // Local UI state
  let isVisible = $state(false);
  let hasAnimated = $state(false);
  let showHoverEffect = $state(false);
  let bluePulseEffect = $state(false);
  let redPulseEffect = $state(false);

  // Derived values
  const beatNumber = $derived(props.beat.beatNumber);
  const isFilled = $derived(props.beat.filled);
  const hasBlueReversal = $derived(props.beat.metadata?.blueReversal || false);
  const hasRedReversal = $derived(props.beat.metadata?.redReversal || false);
  const hasReversals = $derived(hasBlueReversal || hasRedReversal);

  // Animation setup
  $effect(() => {
    // Trigger entrance animation with delay
    const delay = props.animationDelay || 0;
    
    setTimeout(() => {
      isVisible = true;
    }, delay);
  });

  // Event handlers
  function handleClick(event: MouseEvent) {
    event.stopPropagation();

    // Provide haptic feedback
    if (typeof window !== 'undefined' && hapticFeedbackService.isAvailable()) {
      hapticFeedbackService.trigger('selection');
    }

    props.onClick();
  }

  function handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();

    // Provide haptic feedback
    if (typeof window !== 'undefined' && hapticFeedbackService.isAvailable()) {
      hapticFeedbackService.trigger('impact');
    }

    props.onDoubleClick();
  }

  function handleMouseEnter() {
    if (!props.isSelected) {
      showHoverEffect = true;
    }
  }

  function handleMouseLeave() {
    showHoverEffect = false;
  }

  function handleAnimationEnd() {
    hasAnimated = true;
  }

  // Listen for highlight events from GraphEditor
  $effect(() => {
    function handleBeatHighlight(event: CustomEvent) {
      if (!props.isSelected) return;

      const { color } = event.detail;

      if (color === 'blue') {
        bluePulseEffect = false;
        setTimeout(() => {
          bluePulseEffect = true;
          setTimeout(() => (bluePulseEffect = false), 500);
        }, 10);
      } else if (color === 'red') {
        redPulseEffect = false;
        setTimeout(() => {
          redPulseEffect = true;
          setTimeout(() => (redPulseEffect = false), 500);
        }, 10);
      }
    }

    if (typeof window !== 'undefined') {
      document.addEventListener('beat-highlight', handleBeatHighlight as EventListener);
      
      return () => {
        document.removeEventListener('beat-highlight', handleBeatHighlight as EventListener);
      };
    }
  });

  // Performance monitoring (development only)
  $effect(() => {
    if (import.meta.env.DEV) {
      const start = performance.now();
      setTimeout(() => {
        const renderTime = performance.now() - start;
        if (renderTime > 10) {
          console.warn(`Slow BeatCell render: ${renderTime.toFixed(2)}ms for beat ${beatNumber}`);
        }
      }, 0);
    }
  });
</script>

<div
  class="beat-cell modern"
  class:visible={isVisible}
  class:selected={props.isSelected}
  class:filled={isFilled}
  class:hover={showHoverEffect}
  class:animate={!hasAnimated && isVisible}
  onclick={handleClick}
  ondblclick={handleDoubleClick}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onanimationend={handleAnimationEnd}
  role="button"
  tabindex={props.isSelected ? 0 : -1}
  aria-label="Beat {beatNumber}"
  aria-pressed={props.isSelected}
>
  <!-- Main beat content -->
  <div class="beat-content">
    <Beat 
      beat={props.beat} 
      onClick={props.onClick} 
      isSelected={props.isSelected} 
    />
  </div>

  <!-- Selection highlights -->
  {#if props.isSelected}
    <div class="selection-highlights">
      <AnimatedHighlight 
        active={true} 
        color="blue" 
        pulseEffect={bluePulseEffect} 
      />
      {#if hasRedReversal}
        <AnimatedHighlight 
          active={true} 
          color="red" 
          pulseEffect={redPulseEffect} 
        />
      {/if}
    </div>
  {/if}

  <!-- Reversal indicators -->
  {#if hasReversals}
    <div class="reversal-indicator">
      <ReversalGlyph 
        blueReversal={hasBlueReversal}
        redReversal={hasRedReversal}
      />
    </div>
  {/if}

  <!-- Beat number indicator -->
  {#if beatNumber > 0}
    <div class="beat-number" class:visible={props.isSelected || showHoverEffect}>
      {beatNumber}
    </div>
  {/if}
</div>

<style>
  .beat-cell {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(0.9);
    opacity: 0.8;
    contain: layout style paint; /* Performance optimization */
    will-change: transform, opacity; /* GPU acceleration hint */
  }

  .beat-cell.modern {
    /* Modern styling indicator */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .beat-cell.visible {
    transform: scale(1);
    opacity: 1;
  }

  .beat-cell.hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .beat-cell.selected {
    transform: scale(1.05);
    z-index: 10;
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
  }

  .beat-cell.filled {
    opacity: 1;
  }

  .beat-cell.animate {
    animation: beatEntrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .beat-content {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    overflow: hidden;
  }

  .selection-highlights {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 2;
  }

  .reversal-indicator {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 3;
    pointer-events: none;
  }

  .beat-number {
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 3;
    pointer-events: none;
  }

  .beat-number.visible {
    opacity: 1;
  }

  /* Entrance animation */
  @keyframes beatEntrance {
    0% {
      transform: scale(0.6);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Accessibility improvements */
  .beat-cell:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .beat-cell {
      transition: none;
      animation: none;
    }
    
    .beat-cell.hover,
    .beat-cell.selected {
      transform: scale(1);
    }
    
    .beat-cell.animate {
      animation: none;
      transform: scale(1);
      opacity: 1;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .beat-cell.modern {
      border: 2px solid currentColor;
    }
    
    .beat-cell.selected {
      border-color: #3b82f6;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .beat-cell.modern {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .beat-number {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .beat-cell {
      /* Larger touch targets on mobile */
      min-width: 44px;
      min-height: 44px;
    }
    
    .beat-number {
      font-size: 0.6rem;
      padding: 1px 4px;
    }
  }
</style>
