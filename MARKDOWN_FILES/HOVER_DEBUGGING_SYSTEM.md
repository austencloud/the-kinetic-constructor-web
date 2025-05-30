# Hover Loop Debugging System

## Overview

This debugging system is specifically designed to identify and analyze infinite reactive loops that occur during hover events in Svelte 5 components, particularly in the Option, Beat, and StartPosBeat components that use Pictograph.

## Problem Statement

The application experiences `effect_update_depth_exceeded` errors when hovering over Option components. These errors indicate that reactive effects are triggering each other in an infinite loop, causing Svelte to abort the update cycle.

## Debugging Components

### 1. HoverLoopDebugger Class

**Location**: `src/lib/components/Pictograph/ReactiveDebugger.svelte.ts`

**Purpose**: Tracks hover events and reactive effects to identify loops

**Key Methods**:

- `startHoverTracking()` - Begin tracking hover events and effects
- `stopHoverTracking()` - Stop tracking and generate report
- `logHoverEvent()` - Log mouseenter/mouseleave events
- `logHoverEffect()` - Log reactive effect executions
- `analyzeHoverLoop()` - Analyze detected loops

**Loop Detection**:

- Warns when an effect fires >5 times
- Triggers analysis when an effect fires >10 times
- Correlates effects with recent hover events

### 2. HoverTester Class

**Location**: `src/lib/components/Pictograph/ReactiveDebugger.svelte.ts`

**Purpose**: Automated testing utilities to trigger hover conditions

**Test Methods**:

- `rapid(count, delay)` - Rapid hover cycles on first Option
- `sequential(delay)` - Sequential hover across all Options
- `stress(duration)` - Random hover events for stress testing

### 3. Instrumented Components

#### Option.svelte

**Instrumented Effects**:

- `isMobileDevice_derived` - Layout context access
- `scaleFactor_derived` - Layout context access
- `stable_data_init` - Props change detection
- `stable_data_creation` - Data stabilization
- `mount_effect` - Component mounting
- `handleMouseEnter/Leave` - Hover event handlers

#### PictographStateManager.svelte

**Instrumented Effects**:

- `prop_watch_effect` - Props change detection
- `prop_processing` - Untracked prop processing

## Usage Instructions

### Browser Console Commands

```javascript
// Start debugging
hoverDebug.start();

// Stop debugging and get report
hoverDebug.stop();

// Run automated tests
hoverTest.rapid(10, 50); // 10 rapid cycles, 50ms delay
hoverTest.sequential(200); // Sequential test, 200ms delay
hoverTest.stress(5000); // 5 second stress test
```

### Test Page

**URL**: `/test/hover-debug`

**Features**:

- Visual controls for debugging
- Real-time result display
- Test Option components using real pictograph data from the data frame
- Automated test triggers
- Loading states and error handling
- Detailed pictograph information (letter, positions, motion types)

### Console Output Symbols

- 🎯 - Hover events (mouseenter/mouseleave)
- 📍 - Reactive effects firing with count
- 🔄 - Potential loops detected (>5 fires)
- 🚨 - Infinite loops detected (>10 fires)
- 🔬 - Detailed loop analysis
- 🧪 - Test operations

## Expected Findings

Based on the original analysis, the infinite loop is likely caused by:

### 1. Pictograph Data Stabilization Loop

**Symptoms**: `Option.stable_data_init` firing repeatedly
**Cause**: Data changes trigger effects that change data again
**Location**: Option.svelte lines 53-84

### 2. Context Reactivity Cascade

**Symptoms**: `Option.isMobileDevice_derived` or `scaleFactor_derived` firing repeatedly
**Cause**: Layout context access triggers context updates
**Location**: Option.svelte lines 27-34

### 3. Manager Component Circular Dependencies

**Symptoms**: `PictographStateManager.prop_watch_effect` firing repeatedly
**Cause**: Multiple managers calling each other's callbacks
**Location**: PictographStateManager.svelte lines 57-128

## Debugging Workflow

1. **Start Debugging**: Call `hoverDebug.start()` or use test page
2. **Trigger Hover**: Hover over Option components manually or use automated tests
3. **Monitor Console**: Watch for loop warnings and effect counts
4. **Analyze Results**: Use `hoverDebug.stop()` to get detailed report
5. **Identify Root Cause**: Focus on effects with highest fire counts
6. **Apply Targeted Fix**: Fix only the specific reactive chain causing the loop

## Success Criteria

The debugging system should identify:

- **Exact effect name** that loops (e.g., "Option.stable_data_init")
- **Trigger sequence** that starts the loop
- **Fire count** and timing information
- **Related state changes** that contribute to the loop

## Example Expected Output

```
🎯 Option: mouseenter at 1234.56ms
  📍 Option.handleMouseEnter (hover_event) [1x]
  📍 Option.stable_data_init (props_change) [1x]
  📍 Option.stable_data_init (props_change) [2x]
🔄 HOVER LOOP: Option.stable_data_init has fired 6 times
🚨 INFINITE HOVER LOOP: Option.stable_data_init

🔬 Hover Loop Analysis: Option.stable_data_init
Recent hover events:
  1. Option mouseenter → [handleMouseEnter(hover_event)]
Most frequent effects:
  Option.stable_data_init: 11x
```

## Next Steps

1. Run the debugging system on the actual application
2. Identify the specific looping effect
3. Apply targeted fix to break the reactive chain
4. Remove debugging instrumentation after fix is confirmed
5. Document the root cause and solution

## Development Notes

- Debugging is only active in development mode
- Global functions are automatically available in browser console
- Minimal performance impact when not actively debugging
- Can be easily removed after issue is resolved
