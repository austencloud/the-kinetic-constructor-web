import SvgManager from '../SvgManager/SvgManager';
import { parseArrowSvg } from '../SvgManager/parseArrowSvg';
import type { ArrowData } from './ArrowData';

/**
 * Simplified function to load an arrow SVG.
 * This skips transformations and directly loads the raw SVG data.
 */
export async function loadArrowSvg(
    arrowData: ArrowData
): Promise<{ svgData: any }> {
    const svgManager = new SvgManager();

    try {
        // Fetch and validate the SVG
        const svgText = await svgManager.getArrowSvg(
            arrowData.motion.motionType,
            arrowData.motion.startOri,
            arrowData.motion.turns,
            arrowData.motion.color
        );

        // Parse the SVG's viewBox and original center
        const { viewBox, center } = parseArrowSvg(svgText);

        // Return the raw SVG data with basic metadata
        return {
            svgData: {
                imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`, // Base64 encoded SVG
                viewBox,
                center,
            },
        };
    } catch (error) {
        console.error('Error loading arrow SVG:', error);
        return getFallbackData(arrowData);
    }
}

/**
 * Fallback data in case the SVG fails to load.
 */
function getFallbackData(arrowData: ArrowData): { svgData: any } {
    return {
        svgData: {
            imageSrc: '/fallback-arrow.svg',
            viewBox: { x: 0, y: 0, width: 100, height: 100 },
            center: { x: 50, y: 50 },
        },
    };
}
