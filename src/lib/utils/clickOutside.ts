/**
 * Svelte action for detecting clicks outside an element
 */
export function clickOutside(node: HTMLElement, { callback }: { callback: () => void }) {
	const handleClick = (event: MouseEvent) => {
		if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
			callback();
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		},
		update({ callback }: { callback: () => void }) {
			// Update the callback if it changes
		}
	};
}
