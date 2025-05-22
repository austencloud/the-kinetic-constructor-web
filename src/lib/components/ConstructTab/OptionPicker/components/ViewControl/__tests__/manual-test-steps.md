# Manual Test Steps for ViewControl Persistence

This document outlines the steps to manually test the ViewControl persistence functionality, especially for the "Show All" option.

## Test Case 1: "Show All" Persistence

### Steps:
1. Open the application in a browser
2. Navigate to the OptionPicker component
3. Click on the ViewControl dropdown
4. Select "Show All" from the dropdown
5. Verify that:
   - The ViewControl icon shows "Show All"
   - The helper text "Showing all options - select a filter to see sections" is displayed
   - No category tabs are visible
6. Refresh the page
7. Verify that after refresh:
   - The ViewControl icon still shows "Show All"
   - The helper text "Showing all options - select a filter to see sections" is still displayed
   - No category tabs are visible

## Test Case 2: Filter Option Persistence

### Steps:
1. Open the application in a browser
2. Navigate to the OptionPicker component
3. Click on the ViewControl dropdown
4. Select "Sort by Type" from the dropdown
5. Verify that:
   - The ViewControl icon shows "Sort by Type"
   - Category tabs for Type are displayed
   - No helper text is visible
6. Refresh the page
7. Verify that after refresh:
   - The ViewControl icon still shows "Sort by Type"
   - Category tabs for Type are still displayed
   - No helper text is visible

## Test Case 3: Switching Between Options

### Steps:
1. Open the application in a browser
2. Navigate to the OptionPicker component
3. Click on the ViewControl dropdown
4. Select "Sort by Type" from the dropdown
5. Verify that:
   - The ViewControl icon shows "Sort by Type"
   - Category tabs for Type are displayed
6. Click on the ViewControl dropdown again
7. Select "Show All" from the dropdown
8. Verify that:
   - The ViewControl icon shows "Show All"
   - The helper text is displayed
   - No category tabs are visible
9. Refresh the page
10. Verify that after refresh:
    - The ViewControl icon still shows "Show All"
    - The helper text is still displayed
    - No category tabs are visible

## Test Case 4: Console Logging

### Steps:
1. Open the application in a browser
2. Open the browser's developer tools console
3. Navigate to the OptionPicker component
4. Refresh the page
5. Check the console logs for:
   - "Initializing ViewControl with option: [option name]"
   - Any error messages or warnings related to ViewControl
6. Click on the ViewControl dropdown
7. Select different options and verify that appropriate log messages appear:
   - "Selected view option: [option name]"
   - "Saved view option to localStorage: [option name]"

## Debugging Tips

If the tests fail, check the following:

1. Look at the localStorage values in the browser's developer tools:
   - `viewControlMode` should be either "all" or "group"
   - `viewControlSortMethod` should contain the selected sort method when `viewControlMode` is "group"

2. Check the console for any error messages or warnings

3. Verify that the events are being dispatched correctly:
   - `option-picker-update` event
   - `update-view-control` event

4. Ensure that the optionPickerContainer state is being updated correctly:
   - `sortMethod` should match the selected sort method
   - `selectedTab` should be "all" when "Show All" is selected
