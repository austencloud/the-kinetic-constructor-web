# Pictograph Test Data Usage Examples

## Problem Solved

**Before**: Confusing sequence length that included start position

```typescript
// ❌ Confusing - what does length mean?
const sequence = await createTestSequence([Letter.A, Letter.B], true);
console.log(sequence.length); // 3 - includes start position! 😕
```

**After**: Clear separation of start position and sequence beats

```typescript
// ✅ Clear - length is actual sequence length
const sequence = await createTestSequence([Letter.A, Letter.B], true);
console.log(sequence.length); // 2 - actual sequence length! 😊
console.log(sequence.beats.length); // 2 - same as sequence.length
console.log(sequence.startPosition); // Beat object or null
```

## Basic Usage Examples

### 1. Simple Sequence Creation

```typescript
import { createTestSequence } from '$lib/utils/tests/pictographTestHelpers';
import { Letter } from '$lib/types/Letter';

// Create a 3-beat sequence
const sequence = await createTestSequence([Letter.A, Letter.B, Letter.C]);

console.log(`Sequence length: ${sequence.length}`); // 3
console.log(`Has start position: ${sequence.startPosition !== null}`); // false
console.log(`Beat count: ${sequence.beats.length}`); // 3

// Access individual beats
sequence.beats.forEach((beat, index) => {
	console.log(`Beat ${index + 1}: ${beat.pictographData.letter}`);
});
```

### 2. Sequence with Start Position

```typescript
// Create sequence with start position
const sequenceWithStart = await createTestSequence([Letter.A, Letter.B], true);

console.log(`Sequence length: ${sequenceWithStart.length}`); // 2 (excludes start position)
console.log(`Has start position: ${sequenceWithStart.startPosition !== null}`); // true
console.log(`Beat count: ${sequenceWithStart.beats.length}`); // 2

// Access start position
if (sequenceWithStart.startPosition) {
	console.log(`Start position: ${sequenceWithStart.startPosition.pictographData.startPos}`);
}

// Access sequence beats
sequenceWithStart.beats.forEach((beat, index) => {
	console.log(`Beat ${index + 1}: ${beat.pictographData.letter}`);
});
```

### 3. Test Structure

```typescript
describe('My Component Tests', () => {
	beforeEach(async () => {
		await initializeTestDataLoader();
	});

	afterEach(() => {
		resetTestData();
	});

	it('should handle sequence correctly', async () => {
		const sequence = await createTestSequence([Letter.A, Letter.B, Letter.C]);

		// Test actual sequence length (no confusion!)
		expect(sequence.length).toBe(3);
		expect(sequence.beats.length).toBe(3);
		expect(sequence.startPosition).toBe(null);

		// Test individual beats
		expect(sequence.beats[0].pictographData.letter).toBe(Letter.A);
		expect(sequence.beats[1].pictographData.letter).toBe(Letter.B);
		expect(sequence.beats[2].pictographData.letter).toBe(Letter.C);
	});

	it('should handle start position separately', async () => {
		const sequence = await createTestSequence([Letter.A, Letter.B], true);

		// Clear separation of concerns
		expect(sequence.length).toBe(2); // Actual sequence length
		expect(sequence.beats.length).toBe(2); // Same as sequence.length
		expect(sequence.startPosition).toBeTruthy(); // Start position exists

		// Start position is separate
		expect(sequence.startPosition?.pictographData.isStartPosition).toBe(true);
		expect(sequence.startPosition?.id).toBe('start-position');

		// Beats are numbered correctly (1, 2, 3...)
		expect(sequence.beats[0].beatNumber).toBe(1);
		expect(sequence.beats[1].beatNumber).toBe(2);
	});
});
```

## Migration from Old API

### Before (Array-based)

```typescript
// ❌ Old confusing API
const sequence = await createTestSequence([Letter.A, Letter.B], true);
// sequence is Beat[] - includes start position mixed with beats
// sequence.length = 3 (confusing!)
// sequence[0] = start position
// sequence[1] = first beat
// sequence[2] = second beat
```

### After (Object-based)

```typescript
// ✅ New clear API
const sequence = await createTestSequence([Letter.A, Letter.B], true);
// sequence is TestSequence object
// sequence.length = 2 (clear!)
// sequence.startPosition = start position Beat or null
// sequence.beats[0] = first beat
// sequence.beats[1] = second beat
```

### Legacy Support

If you need the old array format for backward compatibility:

```typescript
import { createTestSequenceArray } from '$lib/utils/tests/pictographTestHelpers';

// This returns Beat[] like the old API (deprecated)
const sequenceArray = await createTestSequenceArray([Letter.A, Letter.B], true);
// sequenceArray.length = 3 (includes start position)
```

## Benefits

1. **Clear Intent**: `sequence.length` always means actual sequence length
2. **Explicit Start Position**: `sequence.startPosition` is clearly separate
3. **Type Safety**: TypeScript knows the structure
4. **No Confusion**: Beat numbering starts from 1 for actual beats
5. **Backward Compatibility**: Legacy functions available if needed

## Real Data Accuracy

The system also ensures accurate motion data:

```typescript
const sequence = await createTestSequence([Letter.A]);
const beat = sequence.beats[0];

// Hand rotation direction is calculated correctly based on start/end locations
console.log(beat.pictographData.redMotionData?.handRotDir); // Calculated, not hardcoded!
console.log(beat.pictographData.blueMotionData?.handRotDir); // Calculated, not hardcoded!

// All data comes from real CSV file
console.log(beat.pictographData.startPos); // Real position from CSV
console.log(beat.pictographData.endPos); // Real position from CSV
console.log(beat.pictographData.timing); // Real timing from CSV
```

This ensures your tests use valid, realistic data that matches what users will encounter in the actual application.
