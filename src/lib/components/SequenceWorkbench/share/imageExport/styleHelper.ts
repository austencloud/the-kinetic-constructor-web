// src/lib/components/SequenceWorkbench/share/imageExport/styleHelper.ts

import type { SequenceRenderOptions } from './types';

/**
 * Applies pre-render styles to ensure everything is properly captured
 */
export function applyPreRenderStyles(element: HTMLElement, options: SequenceRenderOptions): void {
  // Store original element styles for restoration
  storeOriginalStyles(element);

  // Make the element and its container fully visible
  ensureElementVisibility(element);
  
  // Make sure all grid elements are visible
  const grids = element.querySelectorAll('image[href*="grid"]');
  grids.forEach((grid) => applyVisibilityStyles(grid as HTMLElement, true));

  // Make sure all letter glyphs are visible
  const glyphs = element.querySelectorAll('.tka-glyph');
  glyphs.forEach((glyph) => applyVisibilityStyles(glyph as HTMLElement, true));

  // Configure beat numbers visibility based on options
  const beatNumbers = element.querySelectorAll('.beat-number');
  beatNumbers.forEach((number) => {
    applyVisibilityStyles(number as HTMLElement, options.addBeatNumbers ?? true);
  });

  // Configure reversal glyphs visibility based on options
  const reversalGlyphs = element.querySelectorAll('.reversal-glyph');
  reversalGlyphs.forEach((glyph) => {
    applyVisibilityStyles(glyph as HTMLElement, options.addReversalSymbols ?? true);
  });
}

/**
 * Restore original styles after rendering
 */
export function restoreOriginalStyles(element: HTMLElement): void {
  // Reset any temporary styling
  const temporaryStyled = element.querySelectorAll('[data-temp-styled]');
  temporaryStyled.forEach((el) => {
    (el as HTMLElement).style.cssText = (el as HTMLElement).dataset.originalStyle || '';
    delete (el as HTMLElement).dataset.tempStyled;
    delete (el as HTMLElement).dataset.originalStyle;
  });
}

/**
 * Store original styles before modification
 */
function storeOriginalStyles(element: HTMLElement): void {
  // Find all elements that will be styled
  const targets = [
    element,
    ...Array.from(element.querySelectorAll('image[href*="grid"], .tka-glyph, .beat-number, .reversal-glyph'))
  ];
  
  // Store original style
  targets.forEach((target) => {
    const el = target as HTMLElement;
    el.dataset.originalStyle = el.style.cssText;
    el.dataset.tempStyled = 'true';
  });
}

/**
 * Apply visibility styles to an element
 */
function applyVisibilityStyles(element: HTMLElement, visible: boolean): void {
  if (visible) {
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    element.style.display = '';
  } else {
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
    // Don't change display to ensure layout is preserved
  }
}

/**
 * Ensure the element is properly visible for rendering
 */
function ensureElementVisibility(element: HTMLElement): void {
  // If element is too small or hidden, force it to be visible
  const needsFix = 
    element.offsetWidth <= 10 || 
    element.offsetHeight <= 10 ||
    getComputedStyle(element).visibility === 'hidden' ||
    getComputedStyle(element).opacity === '0';
    
  if (needsFix) {
    console.log('StyleHelper: Fixing element visibility for rendering');
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    
    // Don't add display:block if it's already visible
    if (element.offsetWidth <= 10 || element.offsetHeight <= 10) {
      element.style.display = 'block';
      element.style.minWidth = '200px';
      element.style.minHeight = '200px';
    }
  }
}