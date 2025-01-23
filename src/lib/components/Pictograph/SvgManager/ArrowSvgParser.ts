import type { ArrowSvgData } from './ArrowSvgData';

// ArrowSvgParser.ts
export const parseArrowSvg = (svgText: string): Omit<ArrowSvgData, 'imageSrc'> => {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;

    if (!svg || svg.tagName !== 'svg') {
        throw new Error('Invalid SVG data: Root element is not <svg>');
    }

    // Get viewBox and fallback if it's missing
    const viewBoxAttr = svg.getAttribute('viewBox') || '0 0 100 100';
    const viewBoxValues = viewBoxAttr.split(/\s+/).map(parseFloat);

    if (viewBoxValues.length !== 4 || viewBoxValues.some(isNaN)) {
        throw new Error(`Invalid viewBox format: ${viewBoxAttr}`);
    }

    const [x, y, width, height] = viewBoxValues;

    // Calculate the center point based on the viewBox
    const result = {
        viewBox: { width, height },
        center: { x: x + width / 2, y: y + height / 2 }
    };


    return result;
};
