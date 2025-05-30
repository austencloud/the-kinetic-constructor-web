# 🚨 NUCLEAR MIGRATION PLAN

## Problem Analysis

Your infinite loops are caused by **circular reactive dependencies** in these components:

### **Primary Culprits:**
1. **OptionPicker** (`src/lib/components/ConstructTab/OptionPicker/`)
   - `optionPickerState.svelte.ts` - Complex reactive state management
   - `OptionPickerMain.svelte` - Effect chains watching sequence changes
   - Multiple event handlers triggering state updates

2. **SequenceState Management** (Multiple competing systems)
   - `src/lib/state/sequence/sequenceState.svelte.ts` (modern runes)
   - `src/lib/state/stores/sequence/SequenceContainer.svelte.ts` (legacy)
   - `src/lib/state/simple/sequenceState.svelte.ts` (another version)

3. **BeatFrame Components** (`src/lib/components/SequenceWorkbench/BeatFrame/`)
   - `BeatFrameGrid.svelte` - Reactive beat rendering
   - `Beat.svelte` - Individual beat reactivity
   - `StartPosBeat.svelte` - Start position reactivity

### **Reactive Loop Chain:**
```
User clicks option → OptionPicker.selectOption() → sequenceState.addBeat() → 
BeatFrame re-renders → OptionPicker refreshes → Options reload → LOOP
```

## Nuclear Solution Strategy

### **Phase 1: Create Isolated State Management**
- ✅ **DONE**: Created minimal test (`/nuclear-test`) that works without loops
- ✅ **DONE**: Verified core functionality works with simple runes

### **Phase 2: Replace State Management (NEXT)**
1. **Create Single Source of Truth**
   - Replace all competing sequence state systems
   - Use only Svelte 5 runes, no stores, no containers
   - Implement exactly like the working nuclear test

2. **Eliminate Circular Dependencies**
   - Remove all `$effect` chains between components
   - Use direct function calls instead of reactive watchers
   - Implement unidirectional data flow

### **Phase 3: Component Migration**
1. **Start with OptionPicker**
   - Replace `optionPickerState.svelte.ts` with simple runes
   - Remove all reactive effects watching sequence changes
   - Use direct callbacks instead of event dispatching

2. **Migrate BeatFrame**
   - Simplify beat rendering to match nuclear test
   - Remove complex reactive dependencies
   - Use props-down, events-up pattern

3. **Clean Up Legacy Code**
   - Remove unused state management files
   - Eliminate XState remnants
   - Remove store abstractions

## Implementation Steps

### **Step 1: Create New State Management**
```typescript
// src/lib/state/nuclear/sequenceState.svelte.ts
let startPosition = $state<PictographData | null>(null);
let beats = $state<PictographData[]>([]);
let isEmpty = $derived(!startPosition && beats.length === 0);

export const nuclearSequenceState = {
  get startPosition() { return startPosition; },
  get beats() { return beats; },
  get isEmpty() { return isEmpty; },
  
  setStartPosition(pos: PictographData) {
    startPosition = { ...pos };
  },
  
  addBeat(beat: PictographData) {
    beats = [...beats, { ...beat }];
  },
  
  clear() {
    startPosition = null;
    beats = [];
  }
};
```

### **Step 2: Replace OptionPicker**
- Remove `optionPickerState.svelte.ts`
- Simplify `OptionPickerMain.svelte` to match nuclear test
- Use direct function calls to `nuclearSequenceState`

### **Step 3: Replace BeatFrame**
- Simplify `BeatFrameGrid.svelte` to match nuclear test
- Remove complex reactive dependencies
- Use simple props for beat data

### **Step 4: Test and Verify**
- Run nuclear test alongside main app
- Gradually replace components one by one
- Verify no infinite loops at each step

## Success Criteria

- ✅ Effect count ≤ 3 per user action
- ✅ No `effect_update_depth_exceeded` errors
- ✅ Smooth transitions between start position and option selection
- ✅ Beat frame updates immediately without loops
- ✅ All existing functionality preserved

## Files to Replace/Remove

### **Remove (Causing Conflicts):**
- `src/lib/state/stores/sequence/SequenceContainer.svelte.ts`
- `src/lib/state/stores/sequence/sequenceState.svelte.ts`
- `src/lib/components/ConstructTab/OptionPicker/optionPickerState.svelte.ts`

### **Replace:**
- `src/lib/state/sequence/sequenceState.svelte.ts` → Nuclear version
- `src/lib/components/ConstructTab/OptionPicker/OptionPickerMain.svelte` → Simplified
- `src/lib/components/SequenceWorkbench/BeatFrame/BeatFrameGrid.svelte` → Simplified

### **Keep (Working):**
- Start position picker components
- Basic pictograph rendering
- UI styling and layout

## Next Action

**Ready to implement Phase 2: Replace State Management**

Should I proceed with creating the nuclear state management system and begin the systematic replacement?
