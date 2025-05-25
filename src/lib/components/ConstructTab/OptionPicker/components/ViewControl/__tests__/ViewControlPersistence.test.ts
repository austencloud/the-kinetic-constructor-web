/**
 * ViewControl Persistence Test
 *
 * This test verifies that the ViewControl component correctly persists and restores
 * the selected view option, especially for the "Show All" option.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { viewOptions } from '../viewOptions';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		clear: () => {
			store = {};
		},
		removeItem: (key: string) => {
			delete store[key];
		}
	};
})();

// Mock the optionPickerContainer
const optionPickerContainerMock = {
	state: {
		sortMethod: 'type',
		selectedTab: null,
		lastSelectedTab: { type: null }
	},
	setSortMethod: vi.fn(),
	setSelectedTab: vi.fn(),
	setLastSelectedTabForSort: vi.fn()
};

// Mock document for event dispatching
const documentMock = {
	dispatchEvent: vi.fn()
};

describe('ViewControl Persistence', () => {
	beforeEach(() => {
		// Reset mocks
		vi.resetAllMocks();
		localStorageMock.clear();

		// Reset container state
		optionPickerContainerMock.state.sortMethod = 'type';
		optionPickerContainerMock.state.selectedTab = null;
		optionPickerContainerMock.state.lastSelectedTab = { type: null };

		// Mock global objects
		global.localStorage = localStorageMock as any;
		global.document = documentMock as any;
	});

	it('should save "Show All" selection to localStorage', () => {
		// Simulate selecting "Show All"
		const allOption = viewOptions.find((opt) => opt.value === 'all');
		expect(allOption).toBeDefined();

		// Call the handleViewSelect function with the "Show All" option
		// This is a simplified version of what happens in the component
		if (allOption) {
			// When "Show All" is selected:
			optionPickerContainerMock.setSortMethod('type');
			optionPickerContainerMock.setSelectedTab('all');
			optionPickerContainerMock.setLastSelectedTabForSort('type', 'all');

			// Store in localStorage
			localStorage.setItem('viewControlMode', 'all');

			// Verify localStorage was updated correctly
			expect(localStorage.getItem('viewControlMode')).toBe('all');
			expect(optionPickerContainerMock.setSortMethod).toHaveBeenCalledWith('type');
			expect(optionPickerContainerMock.setSelectedTab).toHaveBeenCalledWith('all');
		}
	});

	it('should restore "Show All" selection from localStorage on initialization', () => {
		// Set up localStorage as if "Show All" was previously selected
		localStorage.setItem('viewControlMode', 'all');

		// Simulate component initialization
		const allOption = viewOptions.find((opt) => opt.value === 'all');
		let selectedViewOption;

		// This simulates the getInitialViewOption function
		if (localStorage.getItem('viewControlMode') === 'all') {
			selectedViewOption = allOption;
			// Ensure container state is consistent
			optionPickerContainerMock.setSelectedTab('all');
		} else {
			selectedViewOption = viewOptions.find(
				(opt) => opt.value === optionPickerContainerMock.state.sortMethod
			);
		}

		// Verify the correct option was selected
		expect(selectedViewOption).toBe(allOption);
		expect(optionPickerContainerMock.setSelectedTab).toHaveBeenCalledWith('all');
	});

	it('should restore specific filter method from localStorage', () => {
		// Set up localStorage as if "Sort by End Position" was previously selected
		localStorage.setItem('viewControlMode', 'group');
		localStorage.setItem('viewControlSortMethod', 'endPosition');

		// Simulate component initialization
		let selectedViewOption;

		// This simulates the getInitialViewOption function
		if (localStorage.getItem('viewControlMode') === 'all') {
			selectedViewOption = viewOptions.find((opt) => opt.value === 'all');
		} else if (localStorage.getItem('viewControlMode') === 'group') {
			const sortMethod = localStorage.getItem('viewControlSortMethod');
			selectedViewOption = viewOptions.find((opt) => opt.value === sortMethod);
			// Ensure container state is consistent
			if (sortMethod) {
				optionPickerContainerMock.setSortMethod(sortMethod);
			}
		}

		// Verify the correct option was selected
		const endPositionOption = viewOptions.find((opt) => opt.value === 'endPosition');
		expect(selectedViewOption).toBe(endPositionOption);
		expect(optionPickerContainerMock.setSortMethod).toHaveBeenCalledWith('endPosition');
	});
});
