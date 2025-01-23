// svgUtils.ts (new shared utilities)

import type { PropSvgData } from './PropSvgData';

export const parseSvgMetadata = (svgText: string): Omit<PropSvgData, 'imageSrc'> => {
	const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
	const svg = doc.documentElement;

	const [, , vwWidth, vwHeight] = svg.getAttribute('viewBox')?.split(/\s+/) || [];
	const viewBox = {
		width: parseFloat(vwWidth),
		height: parseFloat(vwHeight)
	};

	const centerElement = doc.getElementById('centerPoint');
	const center = centerElement
		? {
				x: parseFloat(centerElement.getAttribute('cx') || '0'),
				y: parseFloat(centerElement.getAttribute('cy') || '0')
			}
		: {
				x: viewBox.width / 2,
				y: viewBox.height / 2
			};

	return { viewBox, center };
};
