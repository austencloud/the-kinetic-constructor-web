# BeatFrame Component Rebuild Guide

## MISSION CRITICAL: Complete BeatFrame Rebuild

The entire `src/lib/components/SequenceWorkbench/BeatFrame/` directory was **NUCLEAR DELETED** due to unsolvable infinite reactive loops. You must rebuild it from scratch with ZERO TOLERANCE for reactive loops.

## WHAT THE BEATFRAME WAS

The BeatFrame is the core component that displays a sequence of dance move pictographs in a horizontal grid. Users can:

- View beats in sequence order
- Click beats to select them
- See the start position as the first element
- Watch new beats appear when added from OptionPicker

## CRITICAL ARCHITECTURE CONTEXT

### State Management Ecosystem

```typescript
// PRIMARY STATE: src/lib/state/sequence/sequenceState.svelte.ts
export const sequenceState = {
  beats: PictographData[],           // Main beats array - REACTIVE
  startPosition: PictographData | null,  // Start position - REACTIVE
  selectedBeatIds: string[],         // Selected beat IDs - REACTIVE
  addBeat(beat: PictographData),     // Adds beat to sequence
  // ... other methods
}

// LEGACY STATE: src/lib/state/stores/sequence/SequenceContainer.svelte
// Still used by some components - creates dual state management conflicts
```

### Data Flow Architecture

```
OptionPicker → sequenceState.addBeat() → sequenceState.beats updates → BeatFrame displays
```

### The Infinite Loop Problem Chain

```
1. User clicks option in OptionPicker
2. OptionPicker calls sequenceState.addBeat(option)
3. sequenceState.beats array updates (reactive)
4. BeatFrame $effect detects beats change
5. BeatFrame updates local state
6. Local state change triggers another effect
7. INFINITE LOOP: Steps 4-6 repeat forever
```

## COMPLETE DATA TYPES

### PictographData Interface

```typescript
// From src/lib/types/PictographData.ts
export interface PictographData {
	// TKA (The Kinetic Alphabet)
	letter: Letter | null; // A, B, C, etc.
	startPos: TKAPosition | null; // Starting position
	endPos: TKAPosition | null; // Ending position

	// VTG (Vertical, Timing, Grid)
	timing: VTGTiming | null;
	direction: VTGDir | null;

	// Grid system
	gridMode: GridMode; // Usually 'diamond'
	gridData: GridData | null;
	grid: string;

	// Motion data for both performers
	blueMotionData: MotionData | null; // Blue performer motion
	redMotionData: MotionData | null; // Red performer motion
	motions?: Motion[];
	redMotion?: Motion | null;
	blueMotion?: Motion | null;

	// Props (objects held by performers)
	redPropData: PropData | null;
	bluePropData: PropData | null;
	props?: PropData[];

	// Arrow indicators
	redArrowData: ArrowData | null;
	blueArrowData: ArrowData | null;

	// Special flags
	isStartPosition?: boolean; // Marks start position beats
}
```

### BeatData Interface (Legacy)

```typescript
// From deleted BeatFrame/BeatData.ts
export interface BeatData {
	id: string; // Unique identifier
	beatNumber: number; // Position in sequence (1, 2, 3...)
	filled: boolean; // Whether beat has data
	pictographData: PictographData; // The actual beat content
}
```

## COMPONENT INTEGRATION POINTS

### Parent Component Structure

```svelte
<!-- SequenceWorkbench/content/SequenceContent.svelte -->
<div class="sequence-content">
	<div class="beat-frame-container">
		<!-- YOUR BEATFRAME COMPONENT GOES HERE -->
		<BeatFrame />
	</div>
</div>
```

### Required CSS Classes

```css
.beat-frame-container {
	/* Grid container for beats */
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	gap: 8px;
	padding: 16px;
}

.pictograph-container {
	/* Individual beat wrapper */
	width: 120px;
	height: 120px;
	border: 2px solid transparent;
	cursor: pointer;
}

.pictograph-container.selected {
	/* Selected state */
	border-color: #007bff;
	background-color: rgba(0, 123, 255, 0.1);
}

.grid-item {
	/* Grid positioning */
	position: relative;
}
```

### Pictograph Component Usage

```svelte
<script>
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
</script>

<!-- For each beat -->
<div class="pictograph-container" class:selected={isSelected}>
	<Pictograph pictographData={beat} beatNumber={index + 1} />
</div>
```

## WHAT CAUSED THE INFINITE LOOPS

### 1. Event Chain Loops (DISABLED)

```typescript
// This pattern was DISABLED due to infinite loops:
// OptionPicker dispatches 'beat-added' event
setTimeout(() => {
	const beatAddedEvent = new CustomEvent('beat-added', {
		detail: { beat: option },
		bubbles: true
	});
	document.dispatchEvent(beatAddedEvent);
}, 100);

// BeatFrame listens for 'beat-added' events
document.addEventListener('beat-added', handleBeatAdded);
// This created circular event chains
```

### 2. Reactive Effect Loops

```typescript
// This pattern caused infinite loops:
$effect(() => {
	const beats = sequenceState.beats; // Read reactive state
	localBeats = beats; // Modify local state
	// Local state change triggers another effect → INFINITE LOOP
});
```

### 3. Dual State Management Conflicts

```typescript
// Multiple state systems fighting each other:
sequenceState.beats; // Modern Svelte 5 runes
sequenceContainer.state; // Legacy store
localComponentState; // Component-level state
// Changes in one triggered updates in others → INFINITE LOOPS
```

## REBUILD STRATEGY

### Phase 1: Static Display (NO REACTIVITY)

```svelte
<!-- BeatFrame.svelte -->
<script>
	// NO reactive imports yet
</script>

<div class="beat-frame-container">
	<div class="grid-item">
		<div class="pictograph-container">Static placeholder beat</div>
	</div>
</div>
```

**TEST:** No loops? ✅ Continue

### Phase 2: Read-Only Reactive Display

```svelte
<script>
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';

	// ONLY read from sequenceState - NEVER modify it
	const beats = $derived(sequenceState.beats);
	const startPosition = $derived(sequenceState.startPosition);
</script>

<div class="beat-frame-container">
	{#if startPosition}
		<div class="grid-item">
			<div class="pictograph-container">
				<Pictograph pictographData={startPosition} beatNumber={0} />
			</div>
		</div>
	{/if}

	{#each beats as beat, index}
		<div class="grid-item">
			<div class="pictograph-container">
				<Pictograph pictographData={beat} beatNumber={index + 1} />
			</div>
		</div>
	{/each}
</div>
```

**TEST:** No loops? ✅ Continue

### Phase 3: Add Selection (CAREFUL)

```svelte
<script>
	// Read selected IDs reactively
	const selectedBeatIds = $derived(sequenceState.selectedBeatIds);

	function handleBeatClick(beatId: string) {
		// ONLY call sequenceState methods - don't modify local state
		sequenceState.selectBeat(beatId);
	}
</script>

<!-- Add click handlers and selection styling -->
```

**TEST:** No loops? ✅ Continue

## CRITICAL SUCCESS CRITERIA

### ✅ MUST HAVE

- Displays beats from `sequenceState.beats`
- Shows start position from `sequenceState.startPosition`
- Handles beat selection via clicks
- Updates when new beats added from OptionPicker
- ZERO infinite reactive loops

### ❌ FORBIDDEN PATTERNS

- Listening to `beat-added` events
- Modifying `sequenceState` from within reactive effects
- Creating local state that mirrors `sequenceState`
- Using `setTimeout` in reactive contexts
- Complex reactive chains with multiple effects

### 🚨 IMMEDIATE STOP CONDITIONS

- ANY `effect_update_depth_exceeded` errors
- ANY infinite console loops
- ANY circular dependency warnings
- Browser freezing or performance issues

## TESTING PROTOCOL

After each phase:

1. Save the file
2. Check browser console for errors
3. Click start position → click option → verify no loops
4. If ANY loops appear → STOP and report exact step
5. Only proceed if completely clean

## FALLBACK PLAN

If infinite loops reoccur during BeatFrame rebuild:

1. Immediately stop BeatFrame development
2. Apply same nuclear deletion to OptionPicker component
3. Rebuild OptionPicker with same strict protocols

The goal is a simple, bulletproof BeatFrame that displays beats without any reactive complexity.

## PREVIOUS BEATFRAME ARCHITECTURE (DELETED)

### Component Structure That Failed

```
BeatFrame/
├── BeatFrame.svelte                    # Main component (entry point)
├── BeatFrameComposable.svelte         # Composable wrapper
├── BeatFrameComposableWithEvents.svelte # Event-heavy wrapper
├── components/
│   └── BeatFrameGrid.svelte           # Grid layout logic
├── composables/
│   ├── useBeatFrameState.svelte.ts    # State management (CAUSED LOOPS)
│   └── useBeatFrameLayout.svelte.ts   # Layout calculations
├── managers/
│   ├── BeatFrameStateManager.svelte   # Complex state manager (CAUSED LOOPS)
│   ├── BeatFrameLayoutManager.svelte  # Layout manager
│   └── BeatFrameElementManager.svelte # DOM element manager
├── Beat.svelte                        # Individual beat component
├── StartPosBeat.svelte               # Start position component
├── AnimatedBeat.svelte               # Beat with animations
├── BeatData.ts                       # Type definitions
└── utils/
    └── beatFrameUtils.ts             # Utility functions
```

### What Each Component Did

**BeatFrame.svelte** - Main entry point that imported state manager
**useBeatFrameState.svelte.ts** - Complex reactive state management with multiple $effect blocks
**BeatFrameStateManager.svelte** - Event listeners and state synchronization (MAJOR LOOP SOURCE)
**Beat.svelte** - Individual beat display with selection logic
**StartPosBeat.svelte** - Special handling for start position with complex reactive patterns

### Key Reactive Patterns That Failed

1. **Circular State Sync**

```typescript
// useBeatFrameState.svelte.ts - CAUSED INFINITE LOOPS
$effect(() => {
	const modernBeats = sequenceState.beats;
	const modernStartPos = sequenceState.startPosition;

	// These mutations triggered other effects
	sequenceIsEmpty = modernIsEmpty;
	startPosition = modernStartPos;
	sequence = { ...sequence, beats: containerBeats };
});
```

2. **Event Listener Chains**

```typescript
// BeatFrameStateManager.svelte - CAUSED INFINITE LOOPS
document.addEventListener('beat-added', handleBeatAdded);

const handleBeatAdded = (event) => {
	// This triggered reactive updates that caused more events
	const currentBeats = sequenceState.beats;
	// Update local state → triggers effects → more events → INFINITE LOOP
};
```

3. **Multiple State Systems Fighting**

```typescript
// Three different state systems all trying to stay in sync:
sequenceState.beats; // Modern runes
sequenceContainer.state; // Legacy store
localBeatFrameState; // Component state

// Each update in one triggered updates in others → CHAOS
```

### Event System That Failed

**beat-added Event Chain:**

```
OptionPicker.selectOption()
→ sequenceState.addBeat()
→ setTimeout(() => dispatch('beat-added'))
→ BeatFrame.handleBeatAdded()
→ Update local state
→ Trigger reactive effects
→ More state changes
→ INFINITE LOOP
```

**Why setTimeout Made It Worse:**

- Intended to "break reactive chains"
- Actually created async timing issues
- Multiple setTimeout calls stacked up
- Each one triggered more reactive updates

### Selection System That Worked

```typescript
// This pattern worked and should be preserved:
function handleBeatClick(beatId: string) {
	sequenceState.selectBeat(beatId); // Direct state update
	// No local state modifications
	// No reactive effects triggered
}

const selectedBeatIds = $derived(sequenceState.selectedBeatIds); // Read-only
```

## REBUILD PRINCIPLES

### ✅ KEEP SIMPLE

- Single BeatFrame.svelte file
- Direct imports from sequenceState
- Read-only reactive patterns
- Direct function calls for actions

### ❌ AVOID COMPLEXITY

- No state managers
- No composables with reactive state
- No event listener chains
- No local state mirroring sequenceState
- No setTimeout in reactive contexts

### 🎯 ARCHITECTURE TARGET

```svelte
<!-- Simple, bulletproof BeatFrame.svelte -->
<script>
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';

	// Read-only reactive state
	const beats = $derived(sequenceState.beats);
	const startPosition = $derived(sequenceState.startPosition);
	const selectedBeatIds = $derived(sequenceState.selectedBeatIds);

	// Simple action handlers
	function handleBeatClick(beatId: string) {
		sequenceState.selectBeat(beatId);
	}

	function handleStartPosClick() {
		sequenceState.selectBeat('start-position');
	}
</script>

<!-- Simple template with no complex logic -->
<div class="beat-frame-container">
	<!-- Start position -->
	{#if startPosition}
		<div class="grid-item">
			<div
				class="pictograph-container"
				class:selected={selectedBeatIds.includes('start-position')}
				onclick={() => handleStartPosClick()}
			>
				<Pictograph pictographData={startPosition} beatNumber={0} />
			</div>
		</div>
	{/if}

	<!-- Regular beats -->
	{#each beats as beat, index}
		<div class="grid-item">
			<div
				class="pictograph-container"
				class:selected={selectedBeatIds.includes(beat.id || `beat-${index}`)}
				onclick={() => handleBeatClick(beat.id || `beat-${index}`)}
			>
				<Pictograph pictographData={beat} beatNumber={index + 1} />
			</div>
		</div>
	{/each}
</div>
```

This architecture eliminates all the complexity that caused infinite loops while preserving all required functionality.
