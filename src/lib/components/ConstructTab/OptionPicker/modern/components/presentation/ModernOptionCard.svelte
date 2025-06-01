<!--
  Modern Option Card - Pure Presentation Component
  Displays individual option with proper accessibility and interaction
-->

<script lang="ts">
  import type { PictographData } from '$lib/types/PictographData';
  import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';

  // Props interface using Svelte 5 runes
  interface Props {
    // Data
    option: PictographData;
    
    // State
    isSelected?: boolean;
    isHighlighted?: boolean;
    isDisabled?: boolean;
    
    // Layout
    size?: 'small' | 'medium' | 'large';
    showDetails?: boolean;
    
    // Events
    onClick: () => void;
    onDoubleClick?: () => void;
    onHover?: (isHovering: boolean) => void;
  }

  const {
    option,
    isSelected = false,
    isHighlighted = false,
    isDisabled = false,
    size = 'medium',
    showDetails = false,
    onClick,
    onDoubleClick,
    onHover
  }: Props = $props();

  // Size configurations
  const sizeConfig = {
    small: { width: 80, height: 80, fontSize: '0.75rem' },
    medium: { width: 120, height: 120, fontSize: '0.875rem' },
    large: { width: 160, height: 160, fontSize: '1rem' }
  };

  const currentSize = sizeConfig[size];

  // Event handlers
  function handleClick() {
    if (!isDisabled) {
      onClick();
    }
  }

  function handleDoubleClick() {
    if (!isDisabled && onDoubleClick) {
      onDoubleClick();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!isDisabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  }

  function handleMouseEnter() {
    if (onHover) {
      onHover(true);
    }
  }

  function handleMouseLeave() {
    if (onHover) {
      onHover(false);
    }
  }
</script>

<!-- Option Card -->
<div
  class="option-card"
  class:option-card--selected={isSelected}
  class:option-card--highlighted={isHighlighted}
  class:option-card--disabled={isDisabled}
  class:option-card--small={size === 'small'}
  class:option-card--medium={size === 'medium'}
  class:option-card--large={size === 'large'}
  style:width="{currentSize.width}px"
  style:height="{currentSize.height}px"
  role="button"
  tabindex={isDisabled ? -1 : 0}
  aria-label="Option {option.letter || 'unknown'}"
  aria-pressed={isSelected}
  aria-disabled={isDisabled}
  onclick={handleClick}
  ondblclick={handleDoubleClick}
  onkeydown={handleKeyDown}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  <!-- Pictograph Display -->
  <div class="option-card__pictograph">
    <Pictograph 
      pictographData={option}
      width={currentSize.width - 16}
      height={currentSize.height - 16}
    />
  </div>

  <!-- Option Details (if enabled) -->
  {#if showDetails}
    <div class="option-card__details" style:font-size={currentSize.fontSize}>
      <div class="option-card__letter">
        {option.letter || '?'}
      </div>
      <div class="option-card__position">
        {option.startPos || ''} → {option.endPos || ''}
      </div>
    </div>
  {/if}

  <!-- Selection Indicator -->
  {#if isSelected}
    <div class="option-card__selection-indicator" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
      </svg>
    </div>
  {/if}
</div>

<style>
  .option-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--option-card-background, #ffffff);
    border: 2px solid var(--option-card-border, #e2e8f0);
    border-radius: var(--option-card-radius, 8px);
    cursor: pointer;
    transition: var(--option-transition, all 0.2s ease);
    user-select: none;
    overflow: hidden;
  }

  .option-card:hover:not(.option-card--disabled) {
    transform: scale(var(--option-hover-scale, 1.05));
    box-shadow: var(--option-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.15));
    border-color: var(--option-card-hover-border, #cbd5e1);
  }

  .option-card:focus-visible {
    outline: 2px solid var(--option-focus-color, #3b82f6);
    outline-offset: 2px;
  }

  .option-card--selected {
    border-color: var(--option-card-selected, #3b82f6);
    background: var(--option-card-selected-background, #eff6ff);
    transform: scale(var(--option-selected-scale, 1.02));
  }

  .option-card--highlighted {
    border-color: var(--option-card-highlighted, #f59e0b);
    background: var(--option-card-highlighted-background, #fffbeb);
  }

  .option-card--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .option-card__pictograph {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    width: 100%;
    padding: 8px;
  }

  .option-card__details {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    text-align: center;
    line-height: 1.2;
  }

  .option-card__letter {
    font-weight: 600;
    margin-bottom: 2px;
  }

  .option-card__position {
    font-size: 0.75em;
    opacity: 0.9;
  }

  .option-card__selection-indicator {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    background: var(--option-card-selected, #3b82f6);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  /* Size variants */
  .option-card--small .option-card__pictograph {
    padding: 4px;
  }

  .option-card--large .option-card__pictograph {
    padding: 12px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .option-card {
      border-width: 1px;
    }
    
    .option-card:hover:not(.option-card--disabled) {
      transform: scale(1.02);
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .option-card {
      border-width: 3px;
    }
    
    .option-card--selected {
      border-width: 4px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .option-card {
      transition: none;
    }
    
    .option-card:hover:not(.option-card--disabled) {
      transform: none;
    }
  }
</style>
