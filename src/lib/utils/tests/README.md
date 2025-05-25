# Pictograph Test Data System

This directory contains a standardized system for using real pictograph data from CSV files in tests, replacing hardcoded mock data with actual valid pictograph combinations from the dataset.

## Overview

The system consists of three main components:

1. **`pictographTestDataLoader.ts`** - Core data loading and management
2. **`pictographTestHelpers.ts`** - Helper functions for common test scenarios
3. **`pictographTestDataLoader.test.ts`** - Tests for the system itself

## Key Benefits

- **Real Data**: Uses actual pictograph combinations from `DiamondPictographDataframe.csv`
- **Accurate Motion Data**: Calculates hand rotation direction based on actual start/end locations
- **Type Safety**: Full TypeScript support with proper type definitions
- **Comprehensive Coverage**: Supports filtering by letter, position, timing, direction, motion type
- **Test Utilities**: Helper functions for creating beats, sequences, and common test objects
- **Singleton Pattern**: Efficient data loading and caching

## Quick Start

### Basic Usage

```typescript
import {
	initializeTestDataLoader,
	getTestPictographByLetter,
	resetTestData
} from '$lib/utils/tests/pictographTestHelpers';
import { Letter } from '$lib/types/Letter';

describe('My Test Suite', () => {
	beforeEach(async () => {
		await initializeTestDataLoader();
	});

	afterEach(() => {
		resetTestData();
	});

	it('should work with real pictograph data', async () => {
		const pictographA = await getTestPictographByLetter(Letter.A);
		expect(pictographA).toBeTruthy();
		expect(pictographA?.letter).toBe(Letter.A);
		// Use real data instead of hardcoded mocks
	});
});
```

### Creating Test Sequences

```typescript
import { createTestSequence } from '$lib/utils/tests/pictographTestHelpers';

// Create a sequence with real data
const sequence = await createTestSequence([Letter.A, Letter.B, Letter.C]);
expect(sequence.length).toBe(3);

// With start position
const sequenceWithStart = await createTestSequence([Letter.A, Letter.B], true);
expect(sequenceWithStart.length).toBe(3); // start + 2 beats
```

### Advanced Filtering

```typescript
import { getPictographTestDataLoader } from '$lib/utils/tests/pictographTestDataLoader';

const loader = getPictographTestDataLoader();
await loader.loadFromCsvContent(csvData);

// Filter by multiple criteria
const proPictographs = loader.getByMotionType('pro');
const splitTimingPictographs = loader.getByTiming('split');
const alpha3StartPictographs = loader.getByStartPosition('alpha3');

// Complex filtering
const specificPictographs = loader.getByMultipleCriteria({
	timing: 'split',
	direction: 'same',
	redMotionType: 'pro'
});
```

## Migration Guide

### Before (Hardcoded Mock Data)

```typescript
// ❌ Old approach - hardcoded mock data
const mockPictographData: PictographData = {
	letter: Letter.A,
	startPos: 'alpha3' as TKAPosition,
	endPos: 'alpha5' as TKAPosition,
	timing: 'split' as VTGTiming,
	direction: 'same' as VTGDir,
	gridMode: 'diamond',
	redMotionData: {
		id: 'red-motion-test',
		motionType: 'pro',
		startOri: 'in',
		endOri: 'in',
		propRotDir: 'cw',
		startLoc: 'e',
		endLoc: 's',
		turns: 0,
		color: 'red',
		leadState: null,
		prefloatMotionType: null,
		prefloatPropRotDir: null,
		handRotDir: 'cw_shift' // Hardcoded - may be incorrect!
	}
	// ... more hardcoded data
};
```

### After (Real Data)

```typescript
// ✅ New approach - real data from CSV
describe('My Test Suite', () => {
	let testPictographData: PictographData;

	beforeEach(async () => {
		await initializeTestDataLoader();
		const pictographA = await getTestPictographByLetter(Letter.A);
		if (!pictographA) {
			throw new Error('Failed to load test pictograph data for Letter A');
		}
		testPictographData = pictographA; // Real data with correct hand rotation!
	});

	afterEach(() => {
		resetTestData();
	});

	it('should work with real data', () => {
		// Use testPictographData - it's real and accurate
		expect(testPictographData.letter).toBe(Letter.A);
		expect(testPictographData.redMotionData?.handRotDir).toBeTruthy();
	});
});
```

## API Reference

### PictographTestDataLoader

Main class for loading and managing pictograph test data.

#### Methods

- `loadFromCsvContent(csvContent: string, gridMode?: string)` - Load data from CSV string
- `loadFromFile(filePath: string, gridMode?: string)` - Load data from file (Node.js)
- `getAllPictographs()` - Get all loaded pictographs
- `getByLetter(letter: Letter)` - Get pictographs by letter
- `getFirstByLetter(letter: Letter)` - Get first pictograph by letter
- `getByStartPosition(startPos: TKAPosition)` - Filter by start position
- `getByEndPosition(endPos: TKAPosition)` - Filter by end position
- `getByTiming(timing: VTGTiming)` - Filter by timing
- `getByDirection(direction: VTGDir)` - Filter by direction
- `getByMotionType(motionType: string, color?: 'red' | 'blue')` - Filter by motion type
- `getRandomPictograph()` - Get random pictograph
- `getRandomPictographs(count: number)` - Get multiple random pictographs
- `getByMultipleCriteria(criteria)` - Complex filtering
- `reset()` - Reset loader state

### Helper Functions

- `initializeTestDataLoader(csvContent?: string)` - Initialize with sample or custom data
- `getTestPictographByLetter(letter: Letter)` - Get test pictograph by letter
- `getTestPictographsByLetters(letters: Letter[])` - Get multiple pictographs
- `createTestSequence(letters: Letter[], includeStartPosition?: boolean)` - Create Beat sequence
- `createTestBeatDataSequence(letters: Letter[], includeStartPosition?: boolean)` - Create BeatData sequence
- `createBeatFromPictographData(pictographData, beatNumber?, id?)` - Convert to Beat object
- `createBeatDataFromPictographData(pictographData, beatNumber?, id?)` - Convert to BeatData object
- `getRandomTestPictographs(count: number)` - Get random pictographs
- `getTestPictographsByCriteria(criteria)` - Filter by criteria
- `resetTestData()` - Reset test data
- `validateTestPictograph(pictograph)` - Validate pictograph structure
- `getTestDataStats()` - Get statistics about loaded data

## Data Accuracy

The system ensures data accuracy by:

1. **Real CSV Data**: Uses actual data from `DiamondPictographDataframe.csv`
2. **Calculated Hand Rotation**: Uses `HandpathCalculator` to determine correct hand rotation direction based on start/end locations
3. **Type Safety**: Proper TypeScript types prevent invalid combinations
4. **Validation**: Built-in validation ensures data integrity

## Sample Data

When the full CSV file is not available, the system includes sample data with valid pictographs:

- Letters A, B, C, D, E, F, G, H, I, W-, X-
- Various positions (alpha3, alpha5, beta3, beta5, gamma11, etc.)
- Different motion types (pro, anti, static, dash)
- Proper timing and direction combinations

## Best Practices

1. **Always initialize**: Call `initializeTestDataLoader()` in `beforeEach`
2. **Clean up**: Call `resetTestData()` in `afterEach`
3. **Check for null**: Always check if pictograph data exists before using
4. **Use real data**: Prefer real data over hardcoded mocks
5. **Test with variety**: Use random pictographs for comprehensive testing
6. **Validate assumptions**: Use `validateTestPictograph()` to ensure data quality

## Examples

See `pictographTestDataLoader.test.ts` for comprehensive examples of all functionality.
