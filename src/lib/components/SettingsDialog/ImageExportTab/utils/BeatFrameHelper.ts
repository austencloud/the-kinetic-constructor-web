/**
 * Utility functions for working with BeatFrame elements in the DOM
 */

/**
 * Creates a temporary element for rendering the BeatFrame
 * @param width Width of the temporary element
 * @param height Height of the temporary element
 * @returns The created temporary element
 */
export function createTemporaryRenderElement(width: number, height: number): HTMLDivElement {
	const tempElement = document.createElement('div');
	tempElement.style.position = 'absolute';
	tempElement.style.left = '-9999px';
	tempElement.style.width = `${width}px`;
	tempElement.style.height = `${height}px`;
	tempElement.className = 'temp-beat-frame-clone';
	document.body.appendChild(tempElement);
	return tempElement;
}

/**
 * Logs detailed information about the BeatFrame element
 */
export function logBeatFrameDetails(): void {
	const beatFrameElement = document.querySelector('.beat-frame-container');
	if (!beatFrameElement) {
		console.error('Could not find BeatFrame element in the DOM');
		return;
	}

	// Verify BeatFrame has necessary elements
	const svgElements = beatFrameElement.querySelectorAll('svg');
	const arrowElements = beatFrameElement.querySelectorAll('.arrow-path, .arrow-head');
	const propElements = beatFrameElement.querySelectorAll('.pictograph-prop');

	// Warn if we're missing expected elements
	if (svgElements.length === 0 || (arrowElements.length === 0 && propElements.length === 0)) {
		console.warn('⚠️ BeatFrame may be missing critical elements for rendering');
	}
}

/**
 * Removes a temporary element from the DOM
 * @param element The element to remove
 */
export function removeTemporaryElement(element: HTMLDivElement): void {
	if (element && element.parentNode) {
		document.body.removeChild(element);
	}
}
