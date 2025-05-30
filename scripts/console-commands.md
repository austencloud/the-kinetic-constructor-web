# Automated Reactive Testing Console Commands

## Overview
The automated reactive testing system is now available in the browser console. Use these commands to systematically test reactive effects and detect infinite loops.

## Prerequisites
1. Start the console bridge: `npm run console-bridge`
2. Start the dev server: `npm run dev`
3. Open browser console (F12)

## Available Commands

### 1. Run Specific Test
```javascript
// Test the current systematic test (13 - OptionPickerState reactive effects)
reactiveTestRunner.runTest(13);

// Test GoldSelectionBorder pulse effect
reactiveTestRunner.runTest(14);

// Test useBeatFrameState reactive effects  
reactiveTestRunner.runTest(15);
```

### 2. Run All Remaining Tests
```javascript
// Run all tests in sequence, stopping if a loop is detected
reactiveTestRunner.runAllTests();
```

### 3. Check Test Status
```javascript
// Get current testing status
reactiveTestRunner.getTestStatus();
```

### 4. View Test Results
```javascript
// Print summary of all completed tests
reactiveTestRunner.printTestSummary();
```

## Test Sequence

### Current Status (Tests 1-12 COMPLETED ✅)
- ✅ BeatFrameStateManager: All reactive effects (Tests 1-8)
- ✅ BeatFrame: All reactive effects (Tests 9-10)  
- ✅ SequenceWidget: Metadata effect (Test 11)
- ✅ OptionPickerMain: Sequence initialization (Test 12)

### Remaining Tests
- 🔄 **Test 13**: OptionPickerState reactive effects (CURRENTLY ENABLED)
- ⏳ **Test 14**: GoldSelectionBorder pulse effect
- ⏳ **Test 15**: useBeatFrameState reactive effects

## How It Works

### Automated Interactions
Each test performs these automated interactions:
1. **Start Position Selection**: Clicks start position picker elements
2. **Beat Addition**: Clicks beat elements and option items
3. **Option Selection**: Interacts with option picker components
4. **Event Dispatching**: Sends custom events as fallbacks

### Loop Detection
The system monitors for:
- `effect_update_depth_exceeded` errors
- `Maximum update depth exceeded` errors
- `infinite loop` messages
- `circular dependency` warnings
- Excessive console output (>50 messages in 5 seconds)

### Test Flow
1. **Stabilization**: Wait 3 seconds for effect to stabilize
2. **Interactions**: Perform 5 rounds of automated interactions
3. **Monitoring**: Watch for loops for 10 seconds
4. **Results**: Report pass/fail with details

## Usage Example

```javascript
// 1. Check current status
console.log('Current test status:', reactiveTestRunner.getTestStatus());

// 2. Run the current test (Test 13)
await reactiveTestRunner.runTest(13);

// 3. If Test 13 passes, manually re-enable the next effect and run Test 14
// (Re-enable GoldSelectionBorder pulse effect in the code)
await reactiveTestRunner.runTest(14);

// 4. Continue with remaining tests
await reactiveTestRunner.runTest(15);

// 5. View final summary
reactiveTestRunner.printTestSummary();
```

## Manual Steps Between Tests

### Before Test 14 (GoldSelectionBorder pulse effect):
1. Re-enable the pulse effect in `src/lib/components/SequenceWorkbench/BeatFrame/GoldSelectionBorder.svelte`
2. Run `reactiveTestRunner.runTest(14)`

### Before Test 15 (useBeatFrameState reactive effects):
1. Re-enable reactive effects in `src/lib/components/SequenceWorkbench/BeatFrame/composables/useBeatFrameState.svelte.ts`
2. Run `reactiveTestRunner.runTest(15)`

## Monitoring Console Bridge

Watch the VS Code terminal running `npm run console-bridge` for:
- ✅ Test completion messages
- 🚨 Infinite loop detection alerts
- 📊 Test result summaries

## Troubleshooting

### If Tests Don't Start
```javascript
// Check if test runner is available
console.log(typeof reactiveTestRunner);

// Reload page if undefined
location.reload();
```

### If Loops Are Detected
1. The test will automatically stop
2. Check the console bridge terminal for detailed error messages
3. The problematic effect should be identified in the logs
4. Revert the last effect re-enabling and investigate

### Manual Interaction Testing
```javascript
// Manually trigger interactions without full test
reactiveTestRunner.tryStartPositionSelection();
reactiveTestRunner.tryBeatAddition();
reactiveTestRunner.tryOptionSelection();
```

## Success Criteria

- ✅ All tests pass without infinite loops
- ✅ Normal user interactions work smoothly
- ✅ No `effect_update_depth_exceeded` errors
- ✅ Console output remains reasonable (<50 messages per interaction)

## Next Steps After All Tests Pass

1. Remove all nuclear test logging
2. Clean up debug console statements
3. Verify app performance
4. Run final integration tests
5. Deploy with confidence! 🚀
