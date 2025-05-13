// src/lib/components/SequenceWorkbench/share/imageExport/svgHelper.ts

import { logger } from '$lib/core/logging';

/**
 * Helper functions for handling SVG elements during image export
 */

/**
 * Prepares SVG elements for rendering by ensuring they have explicit dimensions
 * and are properly visible
 */
export function prepareSvgElements(container: HTMLElement): void {
  try {
    // Find all SVG elements in the container
    const svgElements = container.querySelectorAll('svg');
    
    if (svgElements.length === 0) {
      console.log('SVGHelper: No SVG elements found in container');
      return;
    }
    
    console.log(`SVGHelper: Preparing ${svgElements.length} SVG elements for rendering`);
    
    // Process each SVG element
    svgElements.forEach((svg, index) => {
      try {
        // Store original attributes for restoration
        if (!svg.hasAttribute('data-original-width')) {
          svg.setAttribute('data-original-width', svg.getAttribute('width') || '');
          svg.setAttribute('data-original-height', svg.getAttribute('height') || '');
          svg.setAttribute('data-original-viewbox', svg.getAttribute('viewBox') || '');
        }
        
        // Get computed dimensions
        const rect = svg.getBoundingClientRect();
        const computedWidth = rect.width;
        const computedHeight = rect.height;
        
        // Only fix dimensions if they're missing or invalid
        if (!svg.hasAttribute('width') || !svg.hasAttribute('height') || 
            parseFloat(svg.getAttribute('width') || '0') <= 0 ||
            parseFloat(svg.getAttribute('height') || '0') <= 0) {
          
          // Set explicit dimensions based on computed size or fallback
          const width = computedWidth > 0 ? computedWidth : 100;
          const height = computedHeight > 0 ? computedHeight : 100;
          
          svg.setAttribute('width', `${width}px`);
          svg.setAttribute('height', `${height}px`);
          
          console.log(`SVGHelper: Fixed SVG #${index} dimensions to ${width}x${height}`);
          
          // If viewBox is missing, add it
          if (!svg.hasAttribute('viewBox')) {
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
          }
        }
        
        // Ensure SVG is visible
        svg.style.visibility = 'visible';
        svg.style.display = 'block';
        svg.style.opacity = '1';
        
        // Fix any nested SVG elements
        const nestedSvgs = svg.querySelectorAll('svg');
        if (nestedSvgs.length > 0) {
          console.log(`SVGHelper: Found ${nestedSvgs.length} nested SVG elements`);
          nestedSvgs.forEach(nestedSvg => {
            nestedSvg.style.visibility = 'visible';
            nestedSvg.style.display = 'block';
            nestedSvg.style.opacity = '1';
          });
        }
        
        // Fix any image elements within SVGs
        const images = svg.querySelectorAll('image');
        if (images.length > 0) {
          console.log(`SVGHelper: Found ${images.length} image elements in SVG #${index}`);
          images.forEach(image => {
            image.setAttribute('crossorigin', 'anonymous');
            image.style.visibility = 'visible';
            image.style.opacity = '1';
          });
        }
      } catch (svgError) {
        console.warn(`SVGHelper: Error preparing SVG #${index}:`, svgError);
      }
    });
  } catch (error) {
    logger.error('SVGHelper: Error preparing SVG elements', {
      error: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Restores SVG elements to their original state
 */
export function restoreSvgElements(container: HTMLElement): void {
  try {
    // Find all SVG elements in the container
    const svgElements = container.querySelectorAll('svg[data-original-width]');
    
    if (svgElements.length === 0) {
      return;
    }
    
    console.log(`SVGHelper: Restoring ${svgElements.length} SVG elements`);
    
    // Process each SVG element
    svgElements.forEach((svg) => {
      try {
        // Restore original attributes
        const originalWidth = svg.getAttribute('data-original-width');
        const originalHeight = svg.getAttribute('data-original-height');
        const originalViewBox = svg.getAttribute('data-original-viewbox');
        
        if (originalWidth) {
          if (originalWidth === '') {
            svg.removeAttribute('width');
          } else {
            svg.setAttribute('width', originalWidth);
          }
          svg.removeAttribute('data-original-width');
        }
        
        if (originalHeight) {
          if (originalHeight === '') {
            svg.removeAttribute('height');
          } else {
            svg.setAttribute('height', originalHeight);
          }
          svg.removeAttribute('data-original-height');
        }
        
        if (originalViewBox) {
          if (originalViewBox === '') {
            svg.removeAttribute('viewBox');
          } else {
            svg.setAttribute('viewBox', originalViewBox);
          }
          svg.removeAttribute('data-original-viewbox');
        }
      } catch (svgError) {
        console.warn('SVGHelper: Error restoring SVG:', svgError);
      }
    });
  } catch (error) {
    logger.error('SVGHelper: Error restoring SVG elements', {
      error: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Converts an SVG element to a data URL
 * This can be used as an alternative to html2canvas for SVG elements
 */
export function svgToDataURL(svg: SVGElement): string {
  try {
    // Clone the SVG to avoid modifying the original
    const clone = svg.cloneNode(true) as SVGElement;
    
    // Ensure the clone has dimensions
    const rect = svg.getBoundingClientRect();
    clone.setAttribute('width', `${rect.width}`);
    clone.setAttribute('height', `${rect.height}`);
    
    // Convert to string
    const svgString = new XMLSerializer().serializeToString(clone);
    
    // Create a data URL
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    
    return dataUrl;
  } catch (error) {
    logger.error('SVGHelper: Error converting SVG to data URL', {
      error: error instanceof Error ? error : new Error(String(error))
    });
    return '';
  }
}
