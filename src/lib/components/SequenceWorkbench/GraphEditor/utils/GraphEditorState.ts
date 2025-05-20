// src/lib/components/SequenceWorkbench/GraphEditor/utils/GraphEditorState.ts

// Define the PanelLayout type
type PanelLayout = 'horizontal' | 'vertical';

// Define the state and derived types
interface StateValue<T> {
	value: T;
}

// Create state function
function state<T>(initialValue: T): StateValue<T> {
	return { value: initialValue };
}

// Create derived function
function derived<T>(fn: () => T): StateValue<T> {
	return { value: fn() };
}

// Create effect function
function effect(fn: () => void | (() => void)): void {
	fn();
}

/**
 * Creates and manages responsive state for the GraphEditor component
 * @param containerElement Reference to the container element
 * @param panelLayout Current panel layout from panelStore
 * @returns Object containing all responsive state values and update functions
 */
export function createGraphEditorState(
	containerElement: HTMLElement | null,
	panelLayout: PanelLayout
) {
	// Local state
	const containerHeight = state(0);
	const containerWidth = state(0);
	const isPortrait = state(false);
	const isSmallScreen = state(false);

	// Panel layout derived values
	const isPanelHorizontal = derived(() => panelLayout === 'horizontal');
	const isPanelVertical = derived(() => panelLayout === 'vertical');

	// Minimum size ensures the pictograph is always visible and usable
	const minPictographSize = 220;

	// Dynamic border size based on container dimensions (clamped between 2-6px)
	const borderSize = derived(() =>
		Math.max(
			2,
			Math.min(6, Math.floor(Math.min(containerHeight.value, containerWidth.value) * 0.02))
		)
	);

	// Calculate optimal content size based on container dimensions with better space utilization
	const contentSize = derived(() => {
		const smallerDimension = Math.min(containerHeight.value, containerWidth.value);
		const sizeFactor = isPortrait.value ? 0.7 : 0.6;
		const optimalSize = isPortrait.value
			? Math.max(minPictographSize, containerWidth.value * sizeFactor)
			: Math.max(minPictographSize, smallerDimension * sizeFactor);

		// Ensure the size doesn't exceed 90% of the container height in portrait mode
		return isPortrait.value ? Math.min(optimalSize, containerHeight.value * 0.9) : optimalSize;
	});

	// Final pictograph size with border adjustment
	const pictographSize = derived(() => {
		// Ensure we're working with numbers for the calculation
		return typeof contentSize.value === 'number' ? contentSize.value - 2 * borderSize.value : 0;
	});

	// Update container dimensions when the element is resized
	function updateContainerDimensions() {
		if (containerElement) {
			containerHeight.value = containerElement.clientHeight;
			containerWidth.value = containerElement.clientWidth;
		}
	}

	// Update orientation and screen size based on container dimensions
	effect(() => {
		isPortrait.value = containerWidth.value < containerHeight.value;
		isSmallScreen.value = containerWidth.value < 600; // Threshold for small screen adjustments
	});

	// Set up resize observer
	function setupResizeObserver() {
		if (!containerElement) return null;

		// Initial update of container dimensions
		updateContainerDimensions();

		// Set up resize observer
		const resizeObserver = new ResizeObserver(() => {
			updateContainerDimensions();
		});

		resizeObserver.observe(containerElement);

		// Return cleanup function
		return () => {
			resizeObserver.disconnect();
		};
	}

	return {
		// State values
		containerHeight,
		containerWidth,
		isPortrait,
		isSmallScreen,
		isPanelHorizontal,
		isPanelVertical,
		borderSize,
		contentSize,
		pictographSize,

		// Functions
		updateContainerDimensions,
		setupResizeObserver
	};
}
