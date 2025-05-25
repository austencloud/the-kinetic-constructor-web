# Tab Visibility Test Script

This document outlines the steps to manually test the tab visibility functionality in the ViewControl component.

## Test Case 1: "Show All" Option

### Steps:

1. Open the application in a browser
2. Navigate to the OptionPicker component
3. Click on the ViewControl dropdown
4. Select "Show All" from the dropdown
5. Verify that:
   - The ViewControl icon shows "Show All"
   - The helper text "Showing all options - select a filter to see sections" is displayed
   - No category tabs are visible
6. Check the console logs for:
   - "SHOW ALL SELECTED - Setting selectedTab to 'all'"
   - "HELPER TEXT VISIBLE: 'Show All' is selected"

## Test Case 2: Filter Option (Type)

### Steps:

1. Open the application in a browser
2. Navigate to the OptionPicker component
3. Click on the ViewControl dropdown
4. Select "Sort by Type" from the dropdown
5. Verify that:
   - The ViewControl icon shows "Sort by Type"
   - Category tabs for Type are displayed
   - No helper text is visible
6. Check the console logs for:
   - "FILTER OPTION SELECTED - Setting up tabs for filter method"
   - "TABS VISIBLE: Using type filter with X categories"

## Test Case 3: Filter Option (End Position)

### Steps:

1. Open the application in a browser
2. Navigate to the OptionPicker component
3. Click on the ViewControl dropdown
4. Select "Sort by End Position" from the dropdown
5. Verify that:
   - The ViewControl icon shows "Sort by End Position"
   - Category tabs for End Position are displayed
   - No helper text is visible
6. Check the console logs for:
   - "FILTER OPTION SELECTED - Setting up tabs for filter method"
   - "TABS VISIBLE: Using endPosition filter with X categories"

## Test Case 4: Filter Option (Reversals)

### Steps:

1. Open the application in a browser
2. Navigate to the OptionPicker component
3. Click on the ViewControl dropdown
4. Select "Sort by Reversals" from the dropdown
5. Verify that:
   - The ViewControl icon shows "Sort by Reversals"
   - Category tabs for Reversals are displayed
   - No helper text is visible
6. Check the console logs for:
   - "FILTER OPTION SELECTED - Setting up tabs for filter method"
   - "TABS VISIBLE: Using reversals filter with X categories"

## Test Case 5: Switching Between Options

### Steps:

1. Open the application in a browser
2. Navigate to the OptionPicker component
3. Click on the ViewControl dropdown
4. Select "Sort by Type" from the dropdown
5. Verify that category tabs are displayed
6. Click on the ViewControl dropdown again
7. Select "Show All" from the dropdown
8. Verify that:
   - The helper text is displayed
   - No category tabs are visible
9. Click on the ViewControl dropdown again
10. Select "Sort by End Position" from the dropdown
11. Verify that:
    - Category tabs for End Position are displayed
    - No helper text is visible

## Test Case 6: Page Refresh with "Show All"

### Steps:

1. Open the application in a browser
2. Navigate to the OptionPicker component
3. Click on the ViewControl dropdown
4. Select "Show All" from the dropdown
5. Verify that the helper text is displayed
6. Refresh the page
7. Verify that after refresh:
   - The ViewControl icon still shows "Show All"
   - The helper text is still displayed
   - No category tabs are visible
8. Check the console logs for:
   - "INITIALIZATION: Setting up 'Show All' view"
   - "HELPER TEXT VISIBLE: 'Show All' is selected"

## Test Case 7: Page Refresh with Filter Option

### Steps:

1. Open the application in a browser
2. Navigate to the OptionPicker component
3. Click on the ViewControl dropdown
4. Select "Sort by Type" from the dropdown
5. Verify that category tabs are displayed
6. Refresh the page
7. Verify that after refresh:
   - The ViewControl icon still shows "Sort by Type"
   - Category tabs for Type are still displayed
   - No helper text is visible
8. Check the console logs for:
   - "INITIALIZATION: Setting up filter view for Sort by Type"
   - "TABS VISIBLE: Using type filter with X categories"

## Debugging Tips

If the tests fail, check the following:

1. Look at the localStorage values in the browser's developer tools:

   - `viewControlMode` should be either "all" or "group"
   - `viewControlSortMethod` should contain the selected sort method when `viewControlMode` is "group"

2. Check the console for any error messages or warnings

3. Verify that the showTabs derived store is updating correctly:

   - When "Show All" is selected, it should return false
   - When a filter option is selected, it should return true

4. Ensure that the selectedTab value is being set correctly:
   - When "Show All" is selected, it should be 'all'
   - When a filter option is selected, it should be a specific category key
