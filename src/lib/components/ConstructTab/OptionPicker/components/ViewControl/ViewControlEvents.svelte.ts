/**
 * ViewControlEvents.svelte.ts
 *
 * This module provides event handling functions for the ViewControl component.
 * This file is named with .svelte.ts extension to enable rune syntax.
 */

import type { ViewOption } from './types';
import { viewOptions } from './viewOptions';
import { optionPickerContainer } from '$lib/state/stores/optionPicker/optionPickerContainer.svelte';

/**
 * Set up event listeners for the ViewControl component
 */
export function setupEventListeners(state: any) {
	$effect(() => {
		// Add click outside listener - create a stable reference to the handler
		const clickOutsideHandler = (event: MouseEvent) => {
			// Only handle if the dropdown is open
			if (
				state.isOpen &&
				state.buttonElement &&
				!state.buttonElement.contains(event.target as Node)
			) {
				// Close the dropdown when clicking outside
				state.isOpen = false;
			}
		};

		document.addEventListener('click', clickOutsideHandler);

		// Add listener for update-view-control event
		const handleUpdateViewControl = (event: Event) => {
			if (event instanceof CustomEvent) {
				const detail = event.detail;
				console.log('ViewControl received update-view-control event:', detail);

				if (detail.mode === 'all') {
					const allOption = viewOptions.find((opt) => opt.value === 'all');
					if (allOption) {
						state.selectedViewOption = allOption;
						console.log('ViewControl: Setting to "All" option from event');
					}
				} else if (detail.mode === 'group' && detail.method) {
					const methodOption = viewOptions.find((opt) => opt.value === detail.method);
					if (methodOption) {
						console.log(`ViewControl: Setting to "${methodOption.label}" option from event`);
						state.selectedViewOption = methodOption;
					}
				}
			}
		};

		// Add listener for option-picker-update event
		const handleOptionPickerUpdate = (event: Event) => {
			if (event instanceof CustomEvent) {
				const detail = event.detail;
				console.log('ViewControl received option-picker-update event:', detail);

				// Skip processing if this event was dispatched by this component
				// This prevents infinite loops
				if (detail.source === 'viewControl-effect') {
					console.log('Skipping option-picker-update event from this component');
					return;
				}

				// Set the flag to prevent event loops
				state.isProcessingEvent = true;

				if (detail.sortMethod) {
					const methodOption = viewOptions.find((opt) => opt.value === detail.sortMethod);
					if (methodOption) {
						console.log(
							`ViewControl: Setting to "${methodOption.label}" option from option-picker-update event`
						);
						state.selectedViewOption = methodOption;
					}
				}

				// Reset the flag after a short delay
				setTimeout(() => {
					state.isProcessingEvent = false;
				}, 50);
			}
		};

		document.addEventListener('update-view-control', handleUpdateViewControl);
		document.addEventListener('option-picker-update', handleOptionPickerUpdate);

		return () => {
			document.removeEventListener('click', clickOutsideHandler);
			document.removeEventListener('update-view-control', handleUpdateViewControl);
			document.removeEventListener('option-picker-update', handleOptionPickerUpdate);
			console.log('Event listeners removed during cleanup');
		};
	});
}

// handleClickOutside function has been inlined in the event listener setup

/**
 * Handle keyboard navigation in the dropdown
 */
export function handleKeydown(
	event: KeyboardEvent,
	state: any,
	closeDropdown: () => void,
	handleViewSelect: (option: ViewOption) => void
) {
	if (!state.isOpen) return;

	const currentIndex = viewOptions.findIndex((opt) => opt.value === state.selectedViewOption.value);
	let newIndex = currentIndex;

	switch (event.key) {
		case 'ArrowDown':
			event.preventDefault();
			newIndex = (currentIndex + 1) % viewOptions.length;
			break;
		case 'ArrowUp':
			event.preventDefault();
			newIndex = (currentIndex - 1 + viewOptions.length) % viewOptions.length;
			break;
		case 'Home':
			event.preventDefault();
			newIndex = 0;
			break;
		case 'End':
			event.preventDefault();
			newIndex = viewOptions.length - 1;
			break;
		case 'Enter':
		case ' ':
			event.preventDefault();
			handleViewSelect(state.selectedViewOption);
			return;
		case 'Escape':
			event.preventDefault();
			closeDropdown();
			return;
		case 'Tab':
			// Let Tab work normally, but close the dropdown
			closeDropdown();
			return;
		default:
			// Handle first-letter navigation
			const key = event.key.toLowerCase();
			const matchingOption = viewOptions.find((opt) => opt.label.toLowerCase().startsWith(key));
			if (matchingOption) {
				event.preventDefault();
				newIndex = viewOptions.findIndex((opt) => opt.value === matchingOption.value);
			}
			break;
	}

	if (newIndex !== currentIndex) {
		state.selectedViewOption = viewOptions[newIndex];
	}
}

/**
 * Set up effects to sync UI with container state
 */
export function setupStateEffects(state: any) {
	// Simplified effect to sync the UI with the container state
	// This effect ONLY updates the UI and doesn't trigger further state changes
	$effect(() => {
		// Skip if we're currently processing an event to prevent loops
		if (state.isProcessingEvent) {
			return;
		}

		const currentSortMethod = optionPickerContainer.state.sortMethod;
		const selectedTab = optionPickerContainer.state.selectedTab;

		// Skip if nothing has changed to prevent unnecessary updates
		if (
			currentSortMethod === state.lastKnownSortMethod &&
			selectedTab === state.lastKnownSelectedTab
		) {
			return;
		}

		console.log(
			'ViewControl effect: currentSortMethod =',
			currentSortMethod,
			'selectedTab =',
			selectedTab
		);

		// Update our tracking variables
		state.lastKnownSortMethod = currentSortMethod;
		state.lastKnownSelectedTab = selectedTab;

		// Simple rule: If selectedTab is 'all', show the "All" view option
		if (selectedTab === 'all') {
			const allOption = viewOptions.find((opt) => opt.value === 'all');
			if (allOption && state.selectedViewOption.value !== 'all') {
				state.selectedViewOption = allOption;
				console.log('ViewControl: Setting to "All" option because selectedTab is "all"');

				// Dispatch an event to ensure the UI is updated
				if (typeof document !== 'undefined' && !state.isProcessingEvent) {
					state.isProcessingEvent = true;

					setTimeout(() => {
						const updateEvent = new CustomEvent('option-picker-update', {
							detail: {
								sortMethod: currentSortMethod,
								selectedTab: 'all',
								source: 'viewControl-effect-all'
							},
							bubbles: true
						});
						document.dispatchEvent(updateEvent);

						setTimeout(() => {
							state.isProcessingEvent = false;
						}, 50);
					}, 0);
				}
			}
		}
		// Otherwise, sync with the current sort method
		else if (currentSortMethod) {
			const matchingOption = viewOptions.find((opt) => opt.value === currentSortMethod);
			if (matchingOption && state.selectedViewOption.value !== currentSortMethod) {
				state.selectedViewOption = matchingOption;
				console.log(`ViewControl: Setting to "${matchingOption.label}" option based on sortMethod`);
			}
		}
	});
}
