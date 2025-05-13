/**
 * Utility for finding and caching the BeatFrame element in the DOM
 * This is used by the ShareButton component to find the element to render
 */
import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';

// Global cache for element references
let cachedBeatFrameElement: HTMLElement | null = null;

/**
 * Find the BeatFrame element in the DOM
 * This tries multiple strategies to find the element
 */
export async function findBeatFrameElement(
  propElement: HTMLElement | null = null,
  contextElement: HTMLElement | null = null
): Promise<HTMLElement | null> {
  console.log('ShareElementFinder: findBeatFrameElement called');
  console.log('- propElement:', propElement);
  console.log('- contextElement:', contextElement);
  console.log('- cachedBeatFrameElement:', cachedBeatFrameElement);
  console.log('- global fallback:', browser ? (window as any).__beatFrameElementRef : null);
  console.log('- cached global fallback:', browser ? (window as any).__cachedBeatFrameElement : null);

  // Try all possible sources for the BeatFrame element
  let beatFrameElement = propElement || contextElement || cachedBeatFrameElement;

  // If we still don't have an element, check global fallbacks
  if (!beatFrameElement && browser) {
    beatFrameElement = (window as any).__beatFrameElementRef || (window as any).__cachedBeatFrameElement;
    if (beatFrameElement) {
      console.log('ShareElementFinder: Using global fallback for beatFrameElement');
    }
  }

  // Wait a short time to ensure DOM is fully rendered if needed
  if (!beatFrameElement) {
    console.log('ShareElementFinder: BeatFrame element not provided, waiting briefly for DOM to render...');
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Try again after waiting
    beatFrameElement = propElement || contextElement || cachedBeatFrameElement;

    if (!beatFrameElement && browser) {
      beatFrameElement = (window as any).__beatFrameElementRef || (window as any).__cachedBeatFrameElement;
    }
  }

  // If we still don't have an element, search the DOM
  if (!beatFrameElement) {
    console.log('ShareElementFinder: Still no element, searching the DOM directly');
    beatFrameElement = await findBeatFrameElementInDOM();

    // Cache the found element for future use
    if (beatFrameElement) {
      cachedBeatFrameElement = beatFrameElement;
      if (browser) {
        (window as any).__cachedBeatFrameElement = beatFrameElement;
      }
    }
  }

  // Final check - if we still don't have an element, try one last desperate search
  if (!beatFrameElement) {
    console.log('ShareElementFinder: Last resort DOM search for any possible container');

    // Try to find ANY element that might work
    const possibleContainers = document.querySelectorAll(
      '.beat-frame, .beat-frame-container, .sequence-widget, .sequence-container, .main-layout, .pictograph-wrapper'
    );

    if (possibleContainers.length > 0) {
      beatFrameElement = possibleContainers[0] as HTMLElement;
      console.log('ShareElementFinder: Found last resort element:', beatFrameElement);

      // Cache it
      cachedBeatFrameElement = beatFrameElement;
      if (browser) {
        (window as any).__cachedBeatFrameElement = beatFrameElement;
      }
    }
  }

  // If we STILL don't have an element, give up
  if (!beatFrameElement) {
    console.error('ShareElementFinder: BeatFrame element not available after all attempts.');
    logger.error('BeatFrame element not available after all attempts.');
    return null;
  }

  // Cache the element for future use
  cachedBeatFrameElement = beatFrameElement;
  if (browser) {
    (window as any).__cachedBeatFrameElement = beatFrameElement;
  }

  return beatFrameElement;
}

/**
 * Helper function to find the BeatFrame element in the DOM
 */
async function findBeatFrameElementInDOM(): Promise<HTMLElement | null> {
  console.log('ShareElementFinder: Searching for BeatFrame element in DOM');

  // Try to find the BeatFrame element in the DOM
  const beatFrameElements = document.querySelectorAll('.beat-frame-container');
  if (beatFrameElements.length > 0) {
    console.log('ShareElementFinder: Found .beat-frame-container element');
    return beatFrameElements[0] as HTMLElement;
  }

  // Try to find the beat-frame element
  const beatFrames = document.querySelectorAll('.beat-frame');
  if (beatFrames.length > 0) {
    console.log('ShareElementFinder: Found .beat-frame element');
    return beatFrames[0] as HTMLElement;
  }

  // Try to find the sequence-widget element
  const sequenceWidgets = document.querySelectorAll('.sequence-widget');
  if (sequenceWidgets.length > 0) {
    console.log('ShareElementFinder: Found .sequence-widget element');
    return sequenceWidgets[0] as HTMLElement;
  }

  console.log('ShareElementFinder: No BeatFrame element found in DOM');
  return null;
}

/**
 * Find the actual element to render within the container
 */
export function findRenderElement(container: HTMLElement): HTMLElement {
  console.log('ShareElementFinder: Looking for .beat-frame element within container');
  
  // Try to find .beat-frame within the provided element
  if (container.querySelector) {
    const beatFrameChild = container.querySelector('.beat-frame');
    if (beatFrameChild) {
      console.log('ShareElementFinder: Found .beat-frame child element');
      return beatFrameChild as HTMLElement;
    }
  }

  // If not found, use the element itself
  console.log('ShareElementFinder: Using container element directly');
  return container;
}

/**
 * Set up event listeners for element availability
 */
export function setupElementListeners(): () => void {
  if (!browser) return () => {};

  // Listen for the custom event
  const handleBeatFrameElementAvailable = (event: CustomEvent) => {
    console.log('ShareElementFinder: Received beatframe-element-available event');
    if (event.detail && event.detail.element) {
      cachedBeatFrameElement = event.detail.element;
      (window as any).__cachedBeatFrameElement = event.detail.element;
      console.log('ShareElementFinder: Updated cachedBeatFrameElement from event');
    }
  };

  document.addEventListener(
    'beatframe-element-available',
    handleBeatFrameElementAvailable as EventListener
  );

  // Set up a MutationObserver to detect when the BeatFrame element is added to the DOM
  const observer = new MutationObserver(() => {
    if (!cachedBeatFrameElement) {
      // Try to find the BeatFrame element in the DOM
      setTimeout(async () => {
        const element = await findBeatFrameElementInDOM();
        if (element) {
          cachedBeatFrameElement = element;
          (window as any).__cachedBeatFrameElement = element;
          console.log('ShareElementFinder: Found BeatFrame element via DOM search');
        }
      }, 100);
    }
  });

  // Start observing the document body for DOM changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Return cleanup function
  return () => {
    document.removeEventListener(
      'beatframe-element-available',
      handleBeatFrameElementAvailable as EventListener
    );
    observer.disconnect();
  };
}
